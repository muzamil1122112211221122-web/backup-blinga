// API Testing Module for Forus Heavy API
// Tests all integrated APIs: Groq (main), OpenRouter (secondary), OpenAI (fallback), Gemini (image generation)

import { apiManager } from './api-manager';

interface APITestResult {
  provider: 'groq' | 'openrouter' | 'openai' | 'gemini';
  status: 'success' | 'failed' | 'no_key';
  responseTime?: number;
  model?: string;
  content?: string;
  error?: string;
}

export async function testAllAPIs(): Promise<{
  summary: {
    total: number;
    successful: number;
    failed: number;
    noKey: number;
  };
  results: APITestResult[];
  recommendations: string[];
}> {
  console.log('🚀 Starting comprehensive API testing...');
  const results: APITestResult[] = [];
  const testPrompt = "Hello! Please respond with 'API test successful' to confirm connectivity.";

  // Test Groq API
  await testGroqAPI(results, testPrompt);
  
  // Test OpenRouter APIs (sample a few)
  await testOpenRouterAPIs(results, testPrompt);
  
  // Test OpenAI API
  await testOpenAIAPI(results, testPrompt);
  
  // Test Gemini API (text generation, not image)
  await testGeminiAPI(results, testPrompt);

  // Generate summary and recommendations
  const summary = {
    total: results.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    noKey: results.filter(r => r.status === 'no_key').length
  };

  const recommendations = generateRecommendations(results);

  console.log(`📊 API Test Summary: ${summary.successful}/${summary.total} successful`);
  
  return { summary, results, recommendations };
}

async function testGroqAPI(results: APITestResult[], testPrompt: string) {
  if (!process.env.GROQ_API_KEY) {
    results.push({ provider: 'groq', status: 'no_key', error: 'GROQ_API_KEY not found' });
    return;
  }

  const startTime = Date.now();
  try {
    console.log('🔍 Testing Groq API...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: testPrompt }],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      results.push({
        provider: 'groq',
        status: 'success',
        responseTime,
        model: data.model,
        content: content?.substring(0, 100)
      });
      console.log(`✅ Groq API: Success (${responseTime}ms)`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      results.push({
        provider: 'groq',
        status: 'failed',
        responseTime,
        error: `${response.status}: ${errorData.error?.message || 'Unknown error'}`
      });
      console.log(`❌ Groq API: Failed (${response.status})`);
    }
  } catch (error: any) {
    results.push({
      provider: 'groq',
      status: 'failed',
      responseTime: Date.now() - startTime,
      error: error.message
    });
    console.log(`❌ Groq API: Error - ${error.message}`);
  }
}

async function testOpenRouterAPIs(results: APITestResult[], testPrompt: string) {
  // Test first 3 OpenRouter keys to avoid rate limits
  const keysToTest = [1, 2, 3];
  
  for (const keyIndex of keysToTest) {
    const apiKey = process.env[`OPENROUTER_API_KEY_${keyIndex}`];
    if (!apiKey) {
      results.push({ 
        provider: 'openrouter', 
        status: 'no_key', 
        error: `OPENROUTER_API_KEY_${keyIndex} not found` 
      });
      continue;
    }

    const startTime = Date.now();
    try {
      console.log(`🔍 Testing OpenRouter API Key ${keyIndex}...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000',
          'X-Title': 'Forus Heavy API Test'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 50,
          temperature: 0.1
        })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        results.push({
          provider: 'openrouter',
          status: 'success',
          responseTime,
          model: data.model,
          content: content?.substring(0, 100)
        });
        console.log(`✅ OpenRouter Key ${keyIndex}: Success (${responseTime}ms)`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        results.push({
          provider: 'openrouter',
          status: 'failed',
          responseTime,
          error: `Key ${keyIndex} - ${response.status}: ${errorData.error?.message || 'Unknown error'}`
        });
        console.log(`❌ OpenRouter Key ${keyIndex}: Failed (${response.status})`);
      }
    } catch (error: any) {
      results.push({
        provider: 'openrouter',
        status: 'failed',
        responseTime: Date.now() - startTime,
        error: `Key ${keyIndex} - ${error.message}`
      });
      console.log(`❌ OpenRouter Key ${keyIndex}: Error - ${error.message}`);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function testOpenAIAPI(results: APITestResult[], testPrompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    results.push({ provider: 'openai', status: 'no_key', error: 'OPENAI_API_KEY not found' });
    return;
  }

  const startTime = Date.now();
  try {
    console.log('🔍 Testing OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: testPrompt }],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      results.push({
        provider: 'openai',
        status: 'success',
        responseTime,
        model: data.model,
        content: content?.substring(0, 100)
      });
      console.log(`✅ OpenAI API: Success (${responseTime}ms)`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      results.push({
        provider: 'openai',
        status: 'failed',
        responseTime,
        error: `${response.status}: ${errorData.error?.message || 'Unknown error'}`
      });
      console.log(`❌ OpenAI API: Failed (${response.status})`);
    }
  } catch (error: any) {
    results.push({
      provider: 'openai',
      status: 'failed',
      responseTime: Date.now() - startTime,
      error: error.message
    });
    console.log(`❌ OpenAI API: Error - ${error.message}`);
  }
}

async function testGeminiAPI(results: APITestResult[], testPrompt: string) {
  if (!process.env.GEMINI_API_KEY) {
    results.push({ provider: 'gemini', status: 'no_key', error: 'GEMINI_API_KEY not found' });
    return;
  }

  const startTime = Date.now();
  try {
    console.log('🔍 Testing Gemini API...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: testPrompt }]
        }],
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.1
        }
      })
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      results.push({
        provider: 'gemini',
        status: 'success',
        responseTime,
        model: 'gemini-2.0-flash-exp',
        content: content?.substring(0, 100)
      });
      console.log(`✅ Gemini API: Success (${responseTime}ms)`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      results.push({
        provider: 'gemini',
        status: 'failed',
        responseTime,
        error: `${response.status}: ${errorData.error?.message || 'Unknown error'}`
      });
      console.log(`❌ Gemini API: Failed (${response.status})`);
    }
  } catch (error: any) {
    results.push({
      provider: 'gemini',
      status: 'failed',
      responseTime: Date.now() - startTime,
      error: error.message
    });
    console.log(`❌ Gemini API: Error - ${error.message}`);
  }
}

function generateRecommendations(results: APITestResult[]): string[] {
  const recommendations: string[] = [];
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  const noKey = results.filter(r => r.status === 'no_key');

  if (noKey.length > 0) {
    recommendations.push(`🔑 Missing API keys: ${noKey.map(r => r.provider).join(', ')}. Add these keys to Replit Secrets for full functionality.`);
  }

  if (successful.length === 0) {
    recommendations.push('⚠️ No APIs working! Check your API keys and internet connectivity.');
  } else if (successful.length === 1) {
    recommendations.push(`⚡ Only ${successful[0].provider} API is working. Consider checking other API keys for load balancing.`);
  } else if (successful.length > 2) {
    recommendations.push(`🎉 Multiple APIs working! Excellent redundancy for high availability.`);
  }

  if (failed.length > 0) {
    const creditIssues = failed.filter(r => r.error?.includes('402') || r.error?.includes('credits')).length;
    const rateIssues = failed.filter(r => r.error?.includes('429') || r.error?.includes('rate')).length;
    
    if (creditIssues > 0) {
      recommendations.push(`💳 ${creditIssues} API(s) have credit/billing issues. Check your API accounts.`);
    }
    if (rateIssues > 0) {
      recommendations.push(`⏱️ ${rateIssues} API(s) are rate limited. Try again later or upgrade plans.`);
    }
  }

  const avgResponseTime = successful.reduce((sum, r) => sum + (r.responseTime || 0), 0) / successful.length;
  if (avgResponseTime > 5000) {
    recommendations.push('🐌 APIs are responding slowly. Consider checking network connectivity.');
  } else if (avgResponseTime < 2000) {
    recommendations.push('⚡ Excellent API response times! Your setup is optimized.');
  }

  return recommendations;
}