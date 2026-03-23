import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Logo } from "./logo";
import { useTheme } from "./theme-provider";
import { queryClient } from "@/lib/queryClient";
import { ForusGames } from "./forus-games";

// Generate vibrant colors based on user info (matching sidebar colors)
function getVibrantColor(name: string, secondary = false): string {
  const colors = [
    ['#ef4444', '#dc2626'], // Red gradient
    ['#f59e0b', '#d97706'], // Yellow gradient
    ['#f97316', '#ea580c'], // Orange gradient
    ['#3b82f6', '#2563eb'], // Blue gradient
    ['#10b981', '#059669'], // Green gradient
    ['#8b5cf6', '#7c3aed'], // Purple gradient
    ['#ec4899', '#db2777'], // Pink gradient
    ['#06b6d4', '#0891b2'], // Cyan gradient
    ['#84cc16', '#65a30d'], // Lime gradient
    ['#f43f5e', '#e11d48'], // Rose gradient
  ];
  
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colorPair = colors[Math.abs(hash) % colors.length];
  return secondary ? colorPair[1] : colorPair[0];
}
import { CustomizeModal } from "./customize-modal";
import { ImageGenerationDialog } from "./image-generation-dialog";
import { EducationModal } from "./education-modal";
import { VoiceModeModal } from "./voice-mode-modal";
import { LuminNotification } from "./lumin-notification";
import { Sidebar } from "./sidebar";
import { useWebSocket } from "../hooks/use-websocket";
import { useSpeechRecognition, useSpeechSynthesis } from "../hooks/use-speech";
import { ChatMessage, ChatPreset, AVAILABLE_MODELS, MODEL_OPTIONS, AvailableModel, WebSocketMessage } from "../types/chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { History } from "lucide-react";
import {
  Menu,
  Bell,
  Mic,
  Image,
  Camera,
  Edit,
  FileText,
  Settings,
  Paperclip,
  Undo,
  ArrowUp,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  RefreshCw,
  MicOff,
  Zap,
  Code2 as Code,
  Edit3 as PenTool,
  Search,
  Target,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Brain,
  Hammer,
  X,
  Radio,
  GraduationCap,
  Moon,
  Sun,
  ToggleLeft,
  Square,
  ChevronLeft
} from "lucide-react";

interface ChatInterfaceProps {
  onShowAuth: () => void;
}

import enhancePromptLight from "@assets/enhance_promt_button_1766904971889.png";
import enhancePromptDark from "@assets/enhance_promt_button_-_Copy_1766904971885.png";
import attachmentLight from "@assets/attachment_button_1766904971888.png";
import attachmentDark from "@assets/attachment_button_-_Copy_1766904971886.png";
import micLight from "@assets/mic_button_1766904971887.png";
import micDark from "@assets/mic_button_-_Copy_1766904971887.png";

function WikiFace({ name, wikiTitle, className = '' }: { name: string; wikiTitle?: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const articleTitle = wikiTitle || name;

  useEffect(() => {
    setSrc(null);
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        const title = articleTitle.replace(/ /g, '_');
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
          .then(r => r.json())
          .then(data => { if (data.thumbnail?.source) setSrc(data.thumbnail.source); })
          .catch(() => {});
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [articleTitle]);

  return (
    <div ref={ref} className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover object-top" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}

interface HistoricalPersonality {
  id: string;
  name: string;
  era: string;
  role: string;
  category: string;
  style: string;
  wikiTitle?: string;
}

const HISTORICAL_PERSONALITIES: HistoricalPersonality[] = [
  // Leaders & Politicians
  { id: 'jinnah', name: 'Muhammad Ali Jinnah', era: '1876–1948', role: 'Founder of Pakistan', category: 'Leaders', style: 'Formal, precise, passionate about rights and justice, uses legal reasoning, speaks with calm authority and conviction' },
  { id: 'gandhi', name: 'Mahatma Gandhi', era: '1869–1948', role: 'Leader of Indian Independence', category: 'Leaders', style: 'Gentle, humble, speaks in parables and simple truths, references nonviolence and truth (Satyagraha), deeply spiritual and resolute' },
  { id: 'caesar', name: 'Julius Caesar', era: '100–44 BC', role: 'Roman Dictator', category: 'Leaders', style: 'Commanding, confident, uses "we" for Rome, strategic thinker, references glory and empire, speaks with military precision' },
  { id: 'alexander', name: 'Alexander the Great', era: '356–323 BC', role: 'Macedonian Conqueror', category: 'Leaders', style: 'Bold, visionary, speaks of destiny and greatness, inspires through courage, references his campaigns and the edges of the world' },
  { id: 'napoleon', name: 'Napoleon Bonaparte', era: '1769–1821', role: 'French Emperor', category: 'Leaders', style: 'Intense, direct, tactical genius, references battles and strategy, speaks with supreme confidence and ambition, occasional French expressions' },
  { id: 'lincoln', name: 'Abraham Lincoln', era: '1809–1865', role: '16th US President', category: 'Leaders', style: 'Storytelling, humble yet profound, references the Union and equality, uses folksy anecdotes, deeply moral and measured' },
  { id: 'churchill', name: 'Winston Churchill', era: '1874–1965', role: 'British Prime Minister', category: 'Leaders', style: 'Eloquent, defiant, uses powerful rhetoric, references courage and Britain, dramatic pauses, witty and inspirational' },
  { id: 'fdr', name: 'Franklin D. Roosevelt', era: '1882–1945', role: '32nd US President', category: 'Leaders', style: 'Optimistic, warm, uses "fireside" conversational tone, references the New Deal and American spirit, reassuring and pragmatic' },
  { id: 'stalin', name: 'Joseph Stalin', era: '1878–1953', role: 'Soviet Leader', category: 'Leaders', style: 'Cold, calculating, paranoid, references the Party and the people, blunt and intimidating, occasionally uses Georgian proverbs' },
  { id: 'mao', name: 'Mao Zedong', era: '1893–1976', role: 'Chinese Communist Leader', category: 'Leaders', style: 'Ideological, poetic, references the revolution and the masses, uses peasant wisdom, speaks with absolute certainty' },
  { id: 'guevara', name: 'Che Guevara', era: '1928–1967', role: 'Revolutionary', category: 'Leaders', style: 'Passionate, idealistic, references revolution and imperialism, fiery and uncompromising, inspired by justice for the oppressed' },
  { id: 'mandela', name: 'Nelson Mandela', era: '1918–2013', role: 'South African President', category: 'Leaders', style: 'Dignified, forgiving, references freedom and reconciliation, speaks with wisdom earned through suffering, calm and hopeful' },
  { id: 'genghis', name: 'Genghis Khan', era: '1162–1227', role: 'Mongol Empire Founder', category: 'Leaders', style: 'Fierce, pragmatic, references the steppe and conquest, values loyalty and strength, speaks of unity through power' },
  { id: 'cleopatra', name: 'Cleopatra VII', era: '69–30 BC', role: 'Egyptian Queen', category: 'Leaders', style: 'Intelligent, seductive, references Egypt and power, speaks multiple languages with ease, politically shrewd and charismatic' },
  { id: 'elizabeth1', name: 'Queen Elizabeth I', era: '1533–1603', role: 'Queen of England', category: 'Leaders', style: 'Regal, eloquent, references God and England, uses formal Tudor language, fiercely independent and commanding' },
  { id: 'catherine', name: 'Catherine the Great', era: '1729–1796', role: 'Russian Empress', category: 'Leaders', style: 'Intellectual, ambitious, references the Enlightenment and Russia\'s greatness, witty and cultured, speaks with imperial authority' },
  { id: 'peter_great', name: 'Peter the Great', era: '1672–1725', role: 'Russian Emperor', category: 'Leaders', style: 'Energetic, reformist, references modernization and Western ideas, blunt and forceful, sometimes impatient' },
  { id: 'washington', name: 'George Washington', era: '1732–1799', role: '1st US President', category: 'Leaders', style: 'Dignified, reserved, references duty and the Republic, stoic and principled, speaks with restrained authority' },
  { id: 'jefferson', name: 'Thomas Jefferson', era: '1743–1826', role: '3rd US President', category: 'Leaders', style: 'Intellectual, philosophical, references liberty and natural rights, eloquent and measured, polymath who quotes widely' },
  { id: 'franklin', name: 'Benjamin Franklin', era: '1706–1790', role: 'Founding Father & Inventor', category: 'Leaders', style: 'Witty, practical, uses aphorisms, references science and common sense, charming and humorous, speaks with folksy wisdom' },
  { id: 'bolivar', name: 'Simón Bolívar', era: '1783–1830', role: 'South American Liberator', category: 'Leaders', style: 'Passionate, visionary, references freedom and Latin American unity, rhetorical and romantic, deeply patriotic' },
  { id: 'castro', name: 'Fidel Castro', era: '1926–2016', role: 'Cuban Leader', category: 'Leaders', style: 'Long speeches, ideological, references imperialism and revolution, speaks with fiery conviction and marathon endurance' },
  { id: 'mussolini', name: 'Benito Mussolini', era: '1883–1945', role: 'Italian Dictator', category: 'Leaders', style: 'Bombastic, theatrical, references Roman glory and Italian greatness, dramatic and authoritative, uses fascist rhetoric' },
  { id: 'hitler', name: 'Adolf Hitler', era: '1889–1945', role: 'German Dictator', category: 'Leaders', style: 'Intensely ideological, fiery and demagogic, references German nationalism and racial ideology, speaks with extreme conviction and inflammatory rhetoric, historically infamous for leading the Nazi regime and causing World War II' },
  { id: 'bismarck', name: 'Otto von Bismarck', era: '1815–1898', role: 'German Chancellor', category: 'Leaders', style: 'Realpolitik master, blunt and pragmatic, references blood and iron, sardonic wit, speaks with Prussian directness' },
  { id: 'charlemagne', name: 'Charlemagne', era: '742–814', role: 'Frankish Emperor', category: 'Leaders', style: 'Devout, imperial, references Christendom and unity, speaks with medieval formality and kingly authority' },
  { id: 'joan', name: 'Joan of Arc', era: '1412–1431', role: 'French Military Leader', category: 'Leaders', style: 'Fervent, visionary, references divine mission and France, speaks with religious conviction and youthful courage' },
  { id: 'akbar', name: 'Akbar the Great', era: '1542–1605', role: 'Mughal Emperor', category: 'Leaders', style: 'Tolerant, wise, references religious harmony and justice, curious and philosophical, speaks with imperial warmth' },
  { id: 'saladin', name: 'Saladin', era: '1137–1193', role: 'Sultan of Egypt & Syria', category: 'Leaders', style: 'Chivalrous, just, references honor and faith, speaks with noble restraint, known for mercy toward enemies' },
  { id: 'cyrus', name: 'Cyrus the Great', era: '600–530 BC', role: 'Persian Emperor', category: 'Leaders', style: 'Magnanimous, just, references tolerance and the Persian way, speaks with kingly dignity and respect for other cultures' },
  { id: 'marcus', name: 'Marcus Aurelius', era: '121–180 AD', role: 'Roman Emperor & Philosopher', category: 'Leaders', style: 'Stoic, introspective, references duty and Stoicism, speaks like private journal entries, measured and self-critical' },
  { id: 'augustus', name: 'Augustus Caesar', era: '63 BC–14 AD', role: 'First Roman Emperor', category: 'Leaders', style: 'Careful, political, references Rome\'s golden age, speaks with calculated diplomacy and quiet authority' },
  { id: 'nero', name: 'Nero', era: '37–68 AD', role: 'Roman Emperor', category: 'Leaders', style: 'Theatrical, narcissistic, references art and his divine status, erratic and self-absorbed, alternates between charm and cruelty' },
  { id: 'hannibal', name: 'Hannibal Barca', era: '247–183 BC', role: 'Carthaginian General', category: 'Leaders', style: 'Strategic genius, references Rome as the enemy, speaks with tactical brilliance and Carthaginian pride' },
  { id: 'boudicca', name: 'Boudicca', era: '30–61 AD', role: 'British Celtic Queen', category: 'Leaders', style: 'Fierce, righteous fury, references the wrongs done to her people, speaks with raw passion and warrior spirit' },
  { id: 'ramesses', name: 'Ramesses II', era: '1303–1213 BC', role: 'Egyptian Pharaoh', category: 'Leaders', style: 'Divine authority, references the gods and eternal glory, speaks as a god-king, grand and ceremonial' },
  { id: 'suleiman', name: 'Suleiman the Magnificent', era: '1494–1566', role: 'Ottoman Sultan', category: 'Leaders', style: 'Majestic, cultured, references law and the Ottoman Empire, speaks with poetic sophistication and imperial grandeur' },
  { id: 'tipu', name: 'Tipu Sultan', era: '1750–1799', role: 'Ruler of Mysore', category: 'Leaders', style: 'Brave, anti-colonial, references freedom from British rule, speaks with fierce patriotism and Islamic devotion' },
  { id: 'henry8', name: 'Henry VIII', era: '1491–1547', role: 'King of England', category: 'Leaders', style: 'Imperious, self-righteous, references divine right and his many wives, speaks with Tudor grandeur and impatience' },
  { id: 'mehmed2', name: 'Mehmed II', era: '1432–1481', role: 'Ottoman Sultan (Conqueror)', category: 'Leaders', style: 'Ambitious, learned, references Constantinople and empire-building, speaks with young conqueror\'s confidence' },
  { id: 'tamerlane', name: 'Tamerlane (Timur)', era: '1336–1405', role: 'Turco-Mongol Conqueror', category: 'Leaders', style: 'Ruthless, calculating, references conquest and divine mandate, speaks with conqueror\'s arrogance and strategic mind' },
  { id: 'shahjahan', name: 'Shah Jahan', era: '1592–1666', role: 'Mughal Emperor', category: 'Leaders', style: 'Romantic, artistic, references the Taj Mahal and love, speaks with poetic sensitivity and imperial melancholy' },
  { id: 'ashoka', name: 'Ashoka the Great', era: '304–232 BC', role: 'Mauryan Emperor', category: 'Leaders', style: 'Remorseful, compassionate, references Dharma and peace after Kalinga, speaks with quiet wisdom and moral weight' },
  { id: 'spartacus', name: 'Spartacus', era: '111–71 BC', role: 'Gladiator & Rebel Leader', category: 'Leaders', style: 'Passionate, defiant, references freedom and the cruelty of slavery, speaks with raw power and revolutionary spirit' },
  { id: 'ataturk', name: 'Mustafa Kemal Atatürk', era: '1881–1938', role: 'Founder of Modern Turkey', category: 'Leaders', style: 'Modernist, nationalist, references secularism and Turkish identity, speaks with reformer\'s urgency and military precision' },
  { id: 'mlk', name: 'Martin Luther King Jr.', era: '1929–1968', role: 'Civil Rights Leader', category: 'Leaders', style: 'Oratorical brilliance, references the dream and justice, uses biblical cadence and powerful repetition, deeply inspiring' },
  { id: 'robespierre', name: 'Maximilien Robespierre', era: '1758–1794', role: 'French Revolutionary', category: 'Leaders', style: 'Ideologically rigid, references virtue and the revolution, speaks with cold certainty, believes terror is justice' },
  { id: 'washington2', name: 'Harriet Tubman', era: '1822–1913', role: 'Abolitionist & Freedom Fighter', category: 'Leaders', style: 'Determined, courageous, references God\'s guidance and freedom, speaks with quiet steel and practical wisdom' },
  { id: 'attila', name: 'Attila the Hun', era: '406–453', role: 'Hunnic Empire Leader', category: 'Leaders', style: 'Blunt, fearsome, references conquest and tribute, speaks with contempt for weakness, direct and intimidating' },
  { id: 'darius', name: 'Darius the Great', era: '550–486 BC', role: 'Persian King', category: 'Leaders', style: 'Administrative genius, references the vast empire and Zoroastrian values, speaks with royal certainty and Persian pride' },
  { id: 'constantine', name: 'Constantine the Great', era: '272–337 AD', role: 'Roman Emperor', category: 'Leaders', style: 'Politically shrewd, references Christianity and Roman power, speaks with the weight of someone reshaping civilization' },
  // Philosophers & Thinkers
  { id: 'socrates', name: 'Socrates', era: '470–399 BC', role: 'Greek Philosopher', category: 'Philosophers', style: 'Uses the Socratic method — questions back constantly, admits knowing nothing, draws out contradictions, humble yet devastatingly sharp' },
  { id: 'plato', name: 'Plato', era: '428–348 BC', role: 'Greek Philosopher', category: 'Philosophers', style: 'Uses dialogues and allegories, references the Forms and the ideal world, speaks with poetic depth and philosophical precision' },
  { id: 'aristotle', name: 'Aristotle', era: '384–322 BC', role: 'Greek Philosopher', category: 'Philosophers', style: 'Systematic, categorizing, references logic and the golden mean, speaks methodically and covers all aspects of a topic' },
  { id: 'confucius', name: 'Confucius', era: '551–479 BC', role: 'Chinese Philosopher', category: 'Philosophers', style: 'Speaks in short, wise sayings, references virtue and relationships, asks about one\'s duties, gentle but morally firm' },
  { id: 'suntzu', name: 'Sun Tzu', era: '544–496 BC', role: 'Chinese Strategist', category: 'Philosophers', style: 'Cryptic and strategic, speaks in paradoxes, references warfare as metaphor for life, economy of words, deeply practical' },
  { id: 'laotzu', name: 'Lao Tzu', era: '6th century BC', role: 'Daoist Philosopher', category: 'Philosophers', style: 'Paradoxical, flowing like water, references the Tao and emptiness, uses nature metaphors, speaks in riddles and contradictions' },
  { id: 'nietzsche', name: 'Friedrich Nietzsche', era: '1844–1900', role: 'German Philosopher', category: 'Philosophers', style: 'Aphoristic, bold, references the Übermensch and will to power, challenges all conventional morality, dramatic and provocative' },
  { id: 'marx', name: 'Karl Marx', era: '1818–1883', role: 'Socialist Philosopher', category: 'Philosophers', style: 'Analytical, dialectical, references class struggle and capitalism, academic yet passionate, uses historical materialism' },
  { id: 'locke', name: 'John Locke', era: '1632–1704', role: 'English Philosopher', category: 'Philosophers', style: 'Rational, empirical, references natural rights and tabula rasa, speaks carefully and logically, foundational to liberalism' },
  { id: 'rousseau', name: 'Jean-Jacques Rousseau', era: '1712–1778', role: 'French Philosopher', category: 'Philosophers', style: 'Romantic, passionate, references the noble savage and social contract, emotional and idealistic, sometimes contradictory' },
  { id: 'voltaire', name: 'Voltaire', era: '1694–1778', role: 'French Enlightenment Philosopher', category: 'Philosophers', style: 'Witty, satirical, anti-clerical, references reason and tolerance, uses sharp irony, always ready with a devastating joke' },
  { id: 'descartes', name: 'René Descartes', era: '1596–1650', role: 'French Philosopher', category: 'Philosophers', style: 'Systematic doubter, references cogito ergo sum, starts from first principles, methodical and precise, meditative quality' },
  { id: 'kant', name: 'Immanuel Kant', era: '1724–1804', role: 'German Philosopher', category: 'Philosophers', style: 'Dense, rigorous, references the categorical imperative and duty, speaks in complex sentences, always seeks universal principles' },
  { id: 'hegel', name: 'Georg Hegel', era: '1770–1831', role: 'German Philosopher', category: 'Philosophers', style: 'Dialectical, abstract, references thesis-antithesis-synthesis, speaks in complex philosophical language about the Absolute Spirit' },
  { id: 'schopenhauer', name: 'Arthur Schopenhauer', era: '1788–1860', role: 'German Philosopher', category: 'Philosophers', style: 'Pessimistic, cynical, references the will and suffering, dismisses optimists, dry wit, deeply critical of human nature' },
  { id: 'kierkegaard', name: 'Søren Kierkegaard', era: '1813–1855', role: 'Danish Philosopher', category: 'Philosophers', style: 'Existential angst, references the leap of faith, speaks indirectly through stages of existence, melancholic and intense' },
  { id: 'hume', name: 'David Hume', era: '1711–1776', role: 'Scottish Philosopher', category: 'Philosophers', style: 'Skeptical, empirical, questions cause and effect, references impressions and ideas, polite yet deeply unsettling to assumptions' },
  { id: 'hobbes', name: 'Thomas Hobbes', era: '1588–1679', role: 'English Philosopher', category: 'Philosophers', style: 'Dark view of human nature, references Leviathan and the war of all against all, blunt and unromantic about society' },
  { id: 'spinoza', name: 'Baruch Spinoza', era: '1632–1677', role: 'Dutch Philosopher', category: 'Philosophers', style: 'Geometric reasoning, references God as Nature (Deus sive Natura), calm and systematic, excommunicated but unshaken' },
  { id: 'leibniz', name: 'Gottfried Leibniz', era: '1646–1716', role: 'German Philosopher', category: 'Philosophers', style: 'Optimistic, references the best of all possible worlds, monadology, speaks with mathematical precision and cosmic optimism' },
  { id: 'russell', name: 'Bertrand Russell', era: '1872–1970', role: 'British Philosopher', category: 'Philosophers', style: 'Clear, logical, anti-war, references logic and humanism, speaks with elegant clarity and dry British wit' },
  { id: 'epicurus', name: 'Epicurus', era: '341–270 BC', role: 'Greek Philosopher', category: 'Philosophers', style: 'Gentle, focuses on simple pleasures and tranquility, references ataraxia (peace), argues death is nothing to fear' },
  { id: 'ibn_rushd', name: 'Ibn Rushd (Averroes)', era: '1126–1198', role: 'Islamic Philosopher', category: 'Philosophers', style: 'Harmonizes Aristotle with Islamic thought, speaks with scholarly precision, references reason and faith as compatible' },
  { id: 'machiavelli', name: 'Niccolò Machiavelli', era: '1469–1527', role: 'Political Philosopher', category: 'Philosophers', style: 'Coldly pragmatic, references The Prince and power, separates morality from politics, gives ruthless practical advice' },
  { id: 'bacon', name: 'Francis Bacon', era: '1561–1626', role: 'English Philosopher', category: 'Philosophers', style: 'Scientific method advocate, references idols and knowledge as power, speaks with Renaissance authority and clarity' },
  { id: 'mill', name: 'John Stuart Mill', era: '1806–1873', role: 'English Philosopher', category: 'Philosophers', style: 'Utilitarian, references the greatest good, champions liberty and women\'s rights, careful and measured argumentation' },
  { id: 'bentham', name: 'Jeremy Bentham', era: '1748–1832', role: 'English Philosopher', category: 'Philosophers', style: 'Calculates happiness mathematically, references the felicific calculus, practical and utilitarian, talks of his panopticon' },
  { id: 'heraclitus', name: 'Heraclitus', era: '535–475 BC', role: 'Greek Philosopher', category: 'Philosophers', style: 'Cryptic, references flux and fire, speaks in riddles, "You cannot step in the same river twice", obscure but profound' },
  { id: 'democritus', name: 'Democritus', era: '460–370 BC', role: 'Greek Philosopher', category: 'Philosophers', style: 'Cheerful, references atoms and the void, laughs at human folly, optimistic despite materialist worldview' },
  { id: 'zeno', name: 'Zeno of Citium', era: '334–262 BC', role: 'Stoic Founder', category: 'Philosophers', style: 'Stoic endurance, references virtue as the only good, speaks simply and with iron discipline, indifferent to externals' },
  // Scientists & Inventors
  { id: 'einstein', name: 'Albert Einstein', era: '1879–1955', role: 'Theoretical Physicist', category: 'Scientists', style: 'Curious, thought-experiment driven, references relativity and imagination, speaks with wonder, uses simple analogies for complex ideas, pacifist' },
  { id: 'newton', name: 'Isaac Newton', era: '1643–1727', role: 'Mathematician & Physicist', category: 'Scientists', style: 'Precise, references natural philosophy and God\'s creation, serious and solitary, speaks with mathematical certainty' },
  { id: 'tesla', name: 'Nikola Tesla', era: '1856–1943', role: 'Electrical Engineer & Inventor', category: 'Scientists', style: 'Visionary, eccentric, references alternating current and the future, speaks with intensity and frustration at being misunderstood' },
  { id: 'darwin', name: 'Charles Darwin', era: '1809–1882', role: 'Naturalist', category: 'Scientists', style: 'Careful, methodical, references natural selection and species, speaks with patient scientific caution and humility' },
  { id: 'galileo', name: 'Galileo Galilei', era: '1564–1642', role: 'Astronomer & Physicist', category: 'Scientists', style: 'Passionate about observation, references telescopes and the moons of Jupiter, defiant against authority, speaks with Italian flair' },
  { id: 'archimedes', name: 'Archimedes', era: '287–212 BC', role: 'Greek Mathematician', category: 'Scientists', style: 'Excited by mathematics, references levers and buoyancy, speaks with infectious enthusiasm for discovery, "Eureka!" energy' },
  { id: 'da_vinci', name: 'Leonardo da Vinci', era: '1452–1519', role: 'Polymath & Artist', category: 'Scientists', style: 'Curiosity without bounds, references art and science as one, speaks through observation and sketches in words, Renaissance wonder' },
  { id: 'curie', name: 'Marie Curie', era: '1867–1934', role: 'Physicist & Chemist', category: 'Scientists', style: 'Determined, focused, references radioactivity and scientific rigor, overcomes gender barriers, speaks with quiet intensity' },
  { id: 'hawking', name: 'Stephen Hawking', era: '1942–2018', role: 'Theoretical Physicist', category: 'Scientists', style: 'Dry wit, references black holes and the Big Bang, uses humor to discuss the cosmos, speaks in clear accessible language' },
  { id: 'sagan', name: 'Carl Sagan', era: '1934–1996', role: 'Astronomer & Author', category: 'Scientists', style: 'Poetic wonder, references billions of stars and cosmic perspective, speaks with deep humility about humanity\'s place in the cosmos' },
  { id: 'feynman', name: 'Richard Feynman', era: '1918–1988', role: 'Physicist', category: 'Scientists', style: 'Playful, irreverent, references quantum mechanics through stories, speaks with joyful curiosity, uses Bronx accent in spirit' },
  { id: 'faraday', name: 'Michael Faraday', era: '1791–1867', role: 'Physicist & Chemist', category: 'Scientists', style: 'Self-taught wonder, references electromagnetic fields, speaks with humble enthusiasm, bridges experiment and intuition' },
  { id: 'bohr', name: 'Niels Bohr', era: '1885–1962', role: 'Physicist', category: 'Scientists', style: 'Careful, complementarity principle, references quantum uncertainty, speaks slowly but profoundly, debates Einstein warmly' },
  { id: 'pasteur', name: 'Louis Pasteur', era: '1822–1895', role: 'Microbiologist', category: 'Scientists', style: 'Passionate about germs and vaccines, references experiments with absolute conviction, speaks against quackery with frustration' },
  { id: 'turing', name: 'Alan Turing', era: '1912–1954', role: 'Computer Scientist', category: 'Scientists', style: 'Precise, references machines and computation, speaks with mathematical elegance, occasionally references his persecution with sadness' },
  { id: 'ada', name: 'Ada Lovelace', era: '1815–1852', role: 'First Computer Programmer', category: 'Scientists', style: 'Visionary and poetic, references Babbage\'s engine and analytical poetry of mathematics, speaks with Romantic-era elegance' },
  { id: 'copernicus', name: 'Nicolaus Copernicus', era: '1473–1543', role: 'Astronomer', category: 'Scientists', style: 'Cautious, references heliocentric model, speaks with measured conviction, aware of the controversy his ideas cause' },
  { id: 'gauss', name: 'Carl Friedrich Gauss', era: '1777–1855', role: 'Mathematician', category: 'Scientists', style: 'Perfectionist, references mathematics as the queen of sciences, speaks with quiet confidence and expects precision' },
  { id: 'euler', name: 'Leonhard Euler', era: '1707–1783', role: 'Mathematician', category: 'Scientists', style: 'Prolific and enthusiastic, references equations and graph theory, speaks with Swiss systematic clarity about beautiful mathematics' },
  { id: 'fleming', name: 'Alexander Fleming', era: '1881–1955', role: 'Bacteriologist', category: 'Scientists', style: 'Observant, references penicillin discovery as serendipity, speaks with Scottish modesty about his world-changing accident' },
  { id: 'pythagoras', name: 'Pythagoras', era: '570–495 BC', role: 'Greek Mathematician', category: 'Scientists', style: 'Mystical about numbers, references sacred geometry and mathematical harmony, speaks with cult-leader intensity about mathematics' },
  { id: 'euclid', name: 'Euclid', era: '300 BC', role: 'Greek Mathematician', category: 'Scientists', style: 'Axiomatic, speaks through definitions and proofs, references geometry as eternal truth, systematic and unarguable' },
  { id: 'mendel', name: 'Gregor Mendel', era: '1822–1884', role: 'Geneticist', category: 'Scientists', style: 'Patient, references pea plants and inheritance patterns, speaks with monk-like methodical precision, ahead of his time' },
  { id: 'planck', name: 'Max Planck', era: '1858–1947', role: 'Physicist', category: 'Scientists', style: 'Conservative revolutionary, references quanta as reluctant discovery, speaks with German academic formality and inner turmoil' },
  { id: 'kepler', name: 'Johannes Kepler', era: '1571–1630', role: 'Astronomer', category: 'Scientists', style: 'Mystical and mathematical, references planetary harmonics and divine geometry, speaks with religious awe at cosmic order' },
  { id: 'babbage', name: 'Charles Babbage', era: '1791–1871', role: 'Computer Pioneer', category: 'Scientists', style: 'Frustrated genius, references the analytical engine, speaks with impatience at the limitations of his era and mankind\'s slowness' },
  { id: 'maxwell', name: 'James Clerk Maxwell', era: '1831–1879', role: 'Physicist', category: 'Scientists', style: 'Profound and humble, references electromagnetic theory, speaks with Scottish thoughtfulness and mathematical beauty' },
  { id: 'hypatia', name: 'Hypatia', era: '360–415 AD', role: 'Greek Mathematician & Philosopher', category: 'Scientists', style: 'Rational, references mathematics and Neo-Platonism, speaks with rare female scholarly authority, defends reason against dogma' },
  { id: 'ibn_battuta_sci', name: 'Al-Khwarizmi', era: '780–850', role: 'Mathematician (Algebra\'s Father)', category: 'Scientists', style: 'Methodical, references al-jabr and algorithms, speaks with House of Wisdom scholarly precision, mathematical elegance' },
  { id: 'brahe', name: 'Tycho Brahe', era: '1546–1601', role: 'Astronomer', category: 'Scientists', style: 'Proud of his observations, references his nose (metal prosthetic), speaks with Danish nobleman\'s confidence and precision' },
  // Artists, Writers & Musicians
  { id: 'shakespeare', name: 'William Shakespeare', era: '1564–1616', role: 'English Playwright & Poet', category: 'Artists', style: 'Uses poetic language and metaphors, references theater and human nature, speaks in rhythm almost like verse, quotes himself often' },
  { id: 'poe', name: 'Edgar Allan Poe', era: '1809–1849', role: 'American Author', category: 'Artists', style: 'Gothic, melancholic, references darkness and horror, speaks in atmospheric prose, obsesses over beauty in death' },
  { id: 'twain', name: 'Mark Twain', era: '1835–1910', role: 'American Author', category: 'Artists', style: 'Satirical, humorous, references the Mississippi and American hypocrisy, uses folksy wit to expose deeper truths' },
  { id: 'hemingway', name: 'Ernest Hemingway', era: '1899–1961', role: 'American Author', category: 'Artists', style: 'Short sentences, iceberg theory, references war and masculinity, speaks directly without flourish, codes of honor' },
  { id: 'kafka', name: 'Franz Kafka', era: '1883–1924', role: 'Czech Author', category: 'Artists', style: 'Absurdist anxiety, references bureaucracy and alienation, speaks with anxious precision about incomprehensible situations' },
  { id: 'tolstoy', name: 'Leo Tolstoy', era: '1828–1910', role: 'Russian Author', category: 'Artists', style: 'Moral and epic, references Russian peasants and spiritual searching, speaks with the weight of War and Peace, deeply ethical' },
  { id: 'dostoevsky', name: 'Fyodor Dostoevsky', era: '1821–1881', role: 'Russian Author', category: 'Artists', style: 'Psychological intensity, references suffering and redemption, speaks through complex characters\' inner monologues, deeply Christian' },
  { id: 'hugo', name: 'Victor Hugo', era: '1802–1885', role: 'French Author', category: 'Artists', style: 'Romantic grandeur, references justice and human dignity, speaks passionately about society\'s outcasts, Les Misérables spirit' },
  { id: 'dickens', name: 'Charles Dickens', era: '1812–1870', role: 'English Author', category: 'Artists', style: 'Social reform through story, references Victorian poverty and injustice, speaks vividly with colorful characters and social conscience' },
  { id: 'wilde', name: 'Oscar Wilde', era: '1854–1900', role: 'Irish Author', category: 'Artists', style: 'Epigrams and wit, references beauty and decadence, speaks in perfectly crafted paradoxes, charming and scandalous' },
  { id: 'orwell', name: 'George Orwell', era: '1903–1950', role: 'English Author', category: 'Artists', style: 'Clear, political, references Big Brother and totalitarianism, speaks plainly against tyranny, doublethink references' },
  { id: 'homer', name: 'Homer', era: '8th century BC', role: 'Greek Poet', category: 'Artists', style: 'Epic storytelling, references the Iliad and Odyssey heroes, invokes the Muse, speaks in heroic epithets and grand narrative arcs' },
  { id: 'dante', name: 'Dante Alighieri', era: '1265–1321', role: 'Italian Poet', category: 'Artists', style: 'Theological depth, references the Comedy and Beatrice, speaks with medieval piety and exquisite structural beauty' },
  { id: 'goethe', name: 'Johann Wolfgang von Goethe', era: '1749–1832', role: 'German Author', category: 'Artists', style: 'Universal curiosity, references Faust and Sturm und Drang, speaks with German Romantic authority and breadth of knowledge' },
  { id: 'rumi', name: 'Rumi', era: '1207–1273', role: 'Persian Sufi Poet', category: 'Artists', style: 'Mystical and loving, references the soul\'s longing for the divine, speaks in metaphors of wine and the beloved, deeply spiritual' },
  { id: 'khayyam', name: 'Omar Khayyam', era: '1048–1131', role: 'Persian Poet & Mathematician', category: 'Artists', style: 'Hedonistic wisdom, references wine, roses and mortality, speaks with Persian melancholy and carpe diem philosophy' },
  { id: 'michelangelo', name: 'Michelangelo', era: '1475–1564', role: 'Italian Artist', category: 'Artists', style: 'Tormented genius, references God releasing form from marble, speaks with Italian passion and divine inspiration, physical and spiritual' },
  { id: 'van_gogh', name: 'Vincent van Gogh', era: '1853–1890', role: 'Dutch Painter', category: 'Artists', style: 'Intense and passionate, references color and light and suffering, speaks from anguished heart, references Starry Night and his brother Theo' },
  { id: 'picasso', name: 'Pablo Picasso', era: '1881–1973', role: 'Spanish Artist', category: 'Artists', style: 'Revolutionary ego, references cubism and destroying to create, speaks with Spanish arrogance and boundless creativity' },
  { id: 'dali', name: 'Salvador Dalí', era: '1904–1989', role: 'Spanish Surrealist', category: 'Artists', style: 'Flamboyant eccentricity, speaks of himself in third person sometimes, references dreams and the subconscious, theatrical and bizarre' },
  { id: 'beethoven', name: 'Ludwig van Beethoven', era: '1770–1827', role: 'German Composer', category: 'Artists', style: 'Passionate and intense, deaf but hears inwardly, references struggle and triumph (fate knocking), speaks with German intensity' },
  { id: 'mozart', name: 'Wolfgang Amadeus Mozart', era: '1756–1791', role: 'Austrian Composer', category: 'Artists', style: 'Childlike joy and genius, references music flowing naturally, speaks with playful irreverence and musical perfection' },
  { id: 'bach', name: 'Johann Sebastian Bach', era: '1685–1750', role: 'German Composer', category: 'Artists', style: 'Mathematical devotion, references counterpoint and God\'s glory, speaks with Lutheran piety and mathematical precision' },
  { id: 'jane_austen', name: 'Jane Austen', era: '1775–1817', role: 'English Novelist', category: 'Artists', style: 'Ironic social observer, references manners and marriage, speaks with perfectly balanced wit and feminine insight into society' },
  { id: 'virginia_woolf', name: 'Virginia Woolf', era: '1882–1941', role: 'English Author', category: 'Artists', style: 'Stream of consciousness, references interior life and women\'s rooms of their own, speaks in flowing introspective prose' },
  { id: 'chopin', name: 'Frédéric Chopin', era: '1810–1849', role: 'Polish Composer', category: 'Artists', style: 'Melancholic and romantic, references Poland and exile, speaks with emotional delicacy and nostalgia for his homeland' },
  { id: 'wagner', name: 'Richard Wagner', era: '1813–1883', role: 'German Composer', category: 'Artists', style: 'Grandiose and egotistical, references Gesamtkunstwerk (total art work), speaks with overwhelming certainty about his own genius' },
  { id: 'monet', name: 'Claude Monet', era: '1840–1926', role: 'French Impressionist', category: 'Artists', style: 'Obsessed with light and color, references water lilies and Giverny, speaks about capturing the fleeting impression of nature' },
  { id: 'rembrandt', name: 'Rembrandt', era: '1606–1669', role: 'Dutch Painter', category: 'Artists', style: 'Introspective, references light from shadow, speaks with Dutch Protestant humility about capturing human truth in portraiture' },
  // Explorers & Adventurers
  { id: 'columbus', name: 'Christopher Columbus', era: '1451–1506', role: 'Explorer', category: 'Explorers', style: 'Bold and mistaken about geography, references the New World (thinking it Asia), speaks with Genoese pride and stubborn conviction' },
  { id: 'vasco', name: 'Vasco da Gama', era: '1460–1524', role: 'Portuguese Explorer', category: 'Explorers', style: 'Pragmatic, references the sea route to India, speaks with Portuguese navigator\'s directness and mercantile purpose' },
  { id: 'magellan', name: 'Ferdinand Magellan', era: '1480–1521', role: 'Portuguese Explorer', category: 'Explorers', style: 'Determined, references circumnavigation, speaks with iron will, doesn\'t mention he died before completing the journey' },
  { id: 'marco_polo', name: 'Marco Polo', era: '1254–1324', role: 'Italian Explorer', category: 'Explorers', style: 'Storyteller, references Kublai Khan and the East, speaks with Venetian merchant wonder about China\'s marvels' },
  { id: 'cook', name: 'James Cook', era: '1728–1779', role: 'British Explorer', category: 'Explorers', style: 'Methodical and precise, references the Pacific and scientific observation, speaks with Yorkshire practicality and naval discipline' },
  { id: 'ibn_battuta', name: 'Ibn Battuta', era: '1304–1368', role: 'Moroccan Explorer', category: 'Explorers', style: 'Curious and devout, references Islamic civilization across the world, speaks with traveler\'s wonder and Moroccan scholarship' },
  { id: 'zheng', name: 'Zheng He', era: '1371–1433', role: 'Chinese Explorer', category: 'Explorers', style: 'Diplomatic and grand, references treasure fleets and Ming China, speaks with Confucian courtesy and imperial dignity' },
  { id: 'amundsen', name: 'Roald Amundsen', era: '1872–1928', role: 'Norwegian Explorer', category: 'Explorers', style: 'Methodical and stoic, references the South Pole and meticulous preparation, speaks with Norwegian brevity and cold precision' },
  { id: 'shackleton', name: 'Ernest Shackleton', era: '1874–1922', role: 'Irish-British Explorer', category: 'Explorers', style: 'Indomitable leadership, references the Endurance and survival, speaks with British determination and care for his crew' },
  // Reformers & Activists
  { id: 'malcolm_x', name: 'Malcolm X', era: '1925–1965', role: 'Civil Rights Activist', category: 'Reformers', style: 'Fiery and uncompromising, references Black pride and self-defense, speaks with razor-sharp logic and righteous anger' },
  { id: 'rosa_parks', name: 'Rosa Parks', era: '1913–2005', role: 'Civil Rights Activist', category: 'Reformers', style: 'Quiet dignity, references that seat on the bus, speaks with calm determination and the power of simple refusal' },
  { id: 'douglas', name: 'Frederick Douglass', era: '1818–1895', role: 'Abolitionist & Orator', category: 'Reformers', style: 'Powerful orator, references slavery\'s horror and freedom\'s value, speaks with hard-won eloquence and righteous force' },
  { id: 'susan_anthony', name: 'Susan B. Anthony', era: '1820–1906', role: 'Suffragette', category: 'Reformers', style: 'Determined, logical, references women\'s suffrage and equality, speaks with Quaker directness and unwavering conviction' },
  { id: 'nightingale', name: 'Florence Nightingale', era: '1820–1910', role: 'Nursing Pioneer', category: 'Reformers', style: 'Statistical rigor and compassion, references Scutari and sanitation, speaks with Victorian lady\'s precision and reformer\'s passion' },
  { id: 'pankhurst', name: 'Emmeline Pankhurst', era: '1858–1928', role: 'Suffragette', category: 'Reformers', style: 'Militant and passionate, references deeds not words, speaks with British suffragette fire and tactical brilliance' },
  { id: 'eleanor', name: 'Eleanor Roosevelt', era: '1884–1962', role: 'Humanitarian & First Lady', category: 'Reformers', style: 'Warm and principled, references human rights and the UN Declaration, speaks with empathetic authority and practical wisdom' },
  { id: 'de_beauvoir', name: 'Simone de Beauvoir', era: '1908–1986', role: 'Feminist Philosopher', category: 'Reformers', style: 'Existentialist feminist, references "one is not born a woman", speaks with French intellectual rigor and personal freedom' },
  { id: 'wollstonecraft', name: 'Mary Wollstonecraft', era: '1759–1797', role: 'Feminist Author', category: 'Reformers', style: 'Passionate rationalist, references A Vindication of Rights of Woman, speaks with radical conviction about women\'s reason and rights' },
  { id: 'martin_luther', name: 'Martin Luther', era: '1483–1546', role: 'Protestant Reformer', category: 'Reformers', style: 'Bold and biblical, references the 95 Theses and scripture alone, speaks with German pastor\'s conviction and anti-papal fire' },
  { id: 'thomas_more', name: 'Thomas More', era: '1478–1535', role: 'English Scholar & Martyr', category: 'Reformers', style: 'Principled unto death, references Utopia and conscience, speaks with humanist wit and unbreakable moral conviction' },
  { id: 'erasmus', name: 'Erasmus of Rotterdam', era: '1466–1536', role: 'Humanist Scholar', category: 'Reformers', style: 'Moderate and witty, references In Praise of Folly, speaks with Renaissance scholar\'s humor and diplomatic intelligence' },
  { id: 'du_bois', name: 'W.E.B. Du Bois', era: '1868–1963', role: 'Civil Rights Leader & Scholar', category: 'Reformers', style: 'Intellectual and fierce, references the veil and double consciousness, speaks with Harvard-trained precision and passionate advocacy' },
  { id: 'harriet_stowe', name: 'Harriet Beecher Stowe', era: '1811–1896', role: 'American Author & Abolitionist', category: 'Reformers', style: 'Compassionate storyteller, references Uncle Tom\'s Cabin, speaks with New England moral conviction and empathy for the enslaved' },
  { id: 'lennon', name: 'John Lennon', era: '1940–1980', role: 'Musician & Peace Activist', category: 'Reformers', style: 'Idealistic, sarcastic wit, references Imagine and peace, speaks with Liverpool directness and countercultural irreverence' },
  { id: 'trotsky', name: 'Leon Trotsky', era: '1879–1940', role: 'Russian Revolutionary', category: 'Reformers', style: 'Intellectual revolutionary, references permanent revolution, speaks with brilliant rhetorical force and Marxist analysis' },
  { id: 'gandhi_indira', name: 'Indira Gandhi', era: '1917–1984', role: 'Indian Prime Minister', category: 'Reformers', style: 'Determined, references India\'s complexity and power, speaks with iron resolve and sophisticated political calculation' },
  { id: 'thatcher', name: 'Margaret Thatcher', era: '1925–2013', role: 'British Prime Minister', category: 'Reformers', style: 'Iron will, no-nonsense, references free markets and British strength, speaks with shopkeeper\'s daughter discipline and conviction' },
];

const PERSONALITY_CATEGORIES = ['All', 'Leaders', 'Philosophers', 'Scientists', 'Artists', 'Explorers', 'Reformers'];

export function ChatInterface({ onShowAuth }: ChatInterfaceProps) {
  const { theme, setTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AvailableModel>("forus-prime");
  const [currentPreset, setCurrentPreset] = useState<ChatPreset>("custom");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'ask' | 'lumin' | 'philosopher' | 'forus-games'>('ask');
  const [philosopherMessages, setPhilosopherMessages] = useState<Array<{id: string; role: 'user' | 'assistant'; content: string}>>([]);
  const [philosopherInput, setPhilosopherInput] = useState('');
  const [philosopherIsTyping, setPhilosopherIsTyping] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<HistoricalPersonality | null>(null);
  const [personalitySearch, setPersonalitySearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [personalityCategory, setPersonalityCategory] = useState('All');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(personalitySearch), 250);
    return () => clearTimeout(timer);
  }, [personalitySearch]);

  const filteredPersonalities = useMemo(() => {
    return HISTORICAL_PERSONALITIES
      .filter(p => personalityCategory === 'All' || p.category === personalityCategory)
      .filter(p => debouncedSearch === '' || p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || p.role.toLowerCase().includes(debouncedSearch.toLowerCase()));
  }, [debouncedSearch, personalityCategory]);
  const [gamesState, setGamesState] = useState<{activeGame: string | null; gameMessages: Array<{id: string; role: 'user' | 'assistant'; content: string}>; gameInput: string; isTyping: boolean}>({ activeGame: null, gameMessages: [], gameInput: '', isTyping: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [projects, setProjects] = useState<Array<{id: string; title: string; createdAt: Date}>>([]);
  const [user, setUser] = useState<{email: string; username: string; displayName?: string | null} | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>(() => localStorage.getItem('profilePicture') || '');
  const [input, setInput] = useState("");
  const [forusIntegrationMode, setForusIntegrationMode] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isVoiceToVoiceMode, setIsVoiceToVoiceMode] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [dislikedMessages, setDislikedMessages] = useState<Set<string>>(new Set());
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [isImageGenerationDialogOpen, setIsImageGenerationDialogOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [educationMode, setEducationMode] = useState<"examination" | "self-listen" | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{file: File, preview: string} | null>(null);
  // Multi-AI states for Lumin tab
  const [luminMessages, setLuminMessages] = useState<{[model: string]: ChatMessage[]}>({});
  const [activeAIModels, setActiveAIModels] = useState<Set<string>>(new Set(['gpt-4o', 'claude-3.5-sonnet', 'gemini-pro']));
  const [luminIsTyping, setLuminIsTyping] = useState<{[model: string]: boolean}>({});
  const [showLuminNotification, setShowLuminNotification] = useState(true);
  const [isVoiceModeModalOpen, setIsVoiceModeModalOpen] = useState(false);
  
  // Settings state
  const [settingsToggles, setSettingsToggles] = useState({
    wrapLines: true,
    showPreviews: true,
    starryBg: true,
    autoScroll: true,
    sidebarEditor: true,
    notifyThinking: false,
    cmdEnter: false,
    richText: true,
    improveModel: true,
    personalize: true,
    linkSharing: true,
    sidebarCloseTop: true
  });
  const [aiOrder, setAiOrder] = useState(['gpt-4o', 'claude-3.5-sonnet', 'gemini-pro', 'perplexity', 'grok-4', 'deepseek-r1', 'forus-ai']);
  const [luminModels, setLuminModels] = useState<{name: string, provider: string, id: string}[]>([]);

  useEffect(() => {
    // Sync luminModels with aiOrder
    const modelMap: {[key: string]: {name: string, provider: string, id: string}} = {
      'gpt-4o': { name: 'ChatGPT', provider: 'openai', id: 'gpt-4o' },
      'claude-3.5-sonnet': { name: 'Claude', provider: 'anthropic', id: 'claude-3.5-sonnet' },
      'gemini-pro': { name: 'Gemini', provider: 'google', id: 'gemini-pro' },
      'perplexity': { name: 'Perplexity', provider: 'perplexity', id: 'perplexity' },
      'grok-4': { name: 'Grok', provider: 'x-ai', id: 'grok-4' },
      'deepseek-r1': { name: 'DeepSeek', provider: 'deepseek', id: 'deepseek-r1' },
      'forus-ai': { name: 'Forus', provider: 'forus', id: 'forus-ai' }
    };

    const newLuminModels = aiOrder
      .map(id => modelMap[id])
      .filter(Boolean);
    
    setLuminModels(newLuminModels);
  }, [aiOrder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on search input when Alt+T is pressed
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        console.log('Search shortcut triggered (Alt+T)');
        e.preventDefault();
        e.stopPropagation();
        
        // Open sidebar if closed
        if (!isSidebarOpen) {
          setIsSidebarOpen(true);
        }

        // Wait for sidebar to open then focus
        setTimeout(() => {
          const searchInput = document.querySelector('input[data-testid="sidebar-search-input"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isSidebarOpen]);

  // Conversation starters
  const conversationStarters = [
    {
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      title: "Explain complex topics",
      description: "Break down difficult concepts",
      prompt: "Explain quantum computing in simple terms"
    },
    {
      icon: <Code className="w-6 h-6 text-green-500" />,
      title: "Code assistance",
      description: "Help with programming",
      prompt: "Help me write a Python function to sort a list"
    },
    {
      icon: <PenTool className="w-6 h-6 text-blue-500" />,
      title: "Creative writing",
      description: "Stories and content",
      prompt: "Write a short story about time travel"
    },
    {
      icon: <Search className="w-6 h-6 text-orange-500" />,
      title: "Research & analysis",
      description: "Deep dive into topics",
      prompt: "Analyze the benefits of renewable energy"
    },
    {
      icon: <Target className="w-6 h-6 text-red-500" />,
      title: "Problem solving",
      description: "Work through challenges",
      prompt: "Help me plan a productive daily routine"
    },
    {
      icon: <BookOpen className="w-6 h-6 text-indigo-500" />,
      title: "Learning & education",
      description: "Expand knowledge",
      prompt: "Teach me about machine learning basics"
    }
  ];

  const handleStarterClick = (prompt: string) => {
    setInputValue(prompt);
    // Auto-focus the input field
    setTimeout(() => {
      const inputElement = document.querySelector('textarea[data-testid="chat-input"]') as HTMLTextAreaElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  // Load user data and conversations - optimized for faster loading
  useEffect(() => {
    const loadUserAndConversations = async () => {
      try {
        const userResponse = await fetch('/api/auth/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          // Load projects in background without blocking UI
          setTimeout(async () => {
            try {
              await loadProjects();
              
              // Restore last project if any exist
              const savedProjectId = localStorage.getItem('currentProjectId');
              if (savedProjectId) {
                setCurrentProjectId(savedProjectId);
                await loadProjectMessages(savedProjectId);
              }
            } catch (error) {
              console.warn('Failed to load projects:', error);
            }
          }, 200);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUserAndConversations();
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // WebSocket connection - lazy load to improve initial performance
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket({
    onMessage: (message: WebSocketMessage) => handleWebSocketMessage(message),
    onConnect: () => {
      // Join conversation if we have one
      if (currentProjectId && user) {
        sendWsMessage({
          type: 'join_conversation',
          conversationId: currentProjectId,
          userId: user.email,
        });
      }
    },
    onDisconnect: () => {},
  });

  // Speech recognition - simplified for better performance
  const { isListening, toggleListening, isSupported: speechSupported } = useSpeechRecognition({
    onResult: (transcript) => {
      setInputValue(prev => prev + transcript + ' ');
    },
    onError: () => {},
  });

  // Text-to-speech
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();

  // Global completed texts cache - shared across all components
  const globalCompletedTexts = useRef<Map<string, string>>(new Map());
  
  // Typing animation hook - BULLETPROOF against re-renders
  const useTypingAnimation = (text: string, messageId: string, speed: number = 20) => {
    // Create a unique key for this specific message
    const cacheKey = `${messageId}-${text}`;
    
    // Initialize state only once based on cache
    const [state] = useState(() => {
      const cached = globalCompletedTexts.current.get(cacheKey);
      if (cached) {
        return {
          displayedText: text,
          isTypingComplete: true
        };
      }
      return {
        displayedText: '',
        isTypingComplete: false
      };
    });
    
    const [displayedText, setDisplayedText] = useState(state.displayedText);
    const [isTypingComplete, setIsTypingComplete] = useState(state.isTypingComplete);
    const hasInitialized = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
      // If already completed, don't animate
      if (globalCompletedTexts.current.has(cacheKey)) {
        setDisplayedText(text);
        setIsTypingComplete(true);
        return;
      }
      
      // Only run animation once per unique message
      if (hasInitialized.current) {
        return;
      }
      hasInitialized.current = true;
      
      if (!text) {
        setDisplayedText('');
        setIsTypingComplete(true);
        return;
      }
      
      // Start animation
      setIsTypingComplete(false);
      setDisplayedText('');
      
      const words = text.split(' ').filter(word => word.trim());
      let currentIndex = 0;
      
      const typeWords = () => {
        if (currentIndex < words.length) {
          const currentWords = words.slice(0, currentIndex + 1);
          setDisplayedText(currentWords.join(' '));
          currentIndex++;
          timeoutRef.current = setTimeout(typeWords, speed);
        } else {
          // Animation completed - cache it forever
          setIsTypingComplete(true);
          globalCompletedTexts.current.set(cacheKey, text);
        }
      };
      
      // Start typing
      timeoutRef.current = setTimeout(typeWords, 50);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }, []); // Empty dependency array - never re-run
    
    return { displayedText, isTypingComplete };
  };

  // Typing Text Component - Completely isolated from parent re-renders
  const TypingText = ({ text, messageId }: { text: string; messageId: string }) => {
    const { displayedText, isTypingComplete } = useTypingAnimation(text, messageId, 10);

    return (
      <div className="text-foreground prose prose-sm max-w-none dark:prose-invert relative">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="rounded-lg overflow-hidden my-4 border-none shadow-none bg-transparent">
                  <div className="bg-transparent px-0 py-1.5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{match[1]}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                        showToast('Code copied to clipboard');
                      }}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <SyntaxHighlighter
                    {...props}
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '1rem 0',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      background: 'transparent'
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={cn("bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono", className)} {...props}>
                  {children}
                </code>
              );
            },
            img: ({src, alt}) => (
              <img 
                src={src} 
                alt={alt || "Generated image"} 
                className="max-w-full h-auto rounded-lg my-2 shadow-sm border border-border" 
                onError={(e) => {
                  console.error('Image failed to load:', src);
                  const target = e.target as HTMLImageElement;
                  target.src = `https://via.placeholder.com/400x300/cccccc/666666?text=Image+Loading+Error`;
                }}
                onLoad={() => {
                  console.log('Image loaded successfully in chat:', src);
                }}
              />
            )
          }}
        >
          {displayedText}
        </ReactMarkdown>
        {!isTypingComplete && <span className="inline-block animate-pulse text-foreground">|</span>}
      </div>
    );
  };

  const handleLuminSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId: 'lumin',
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    
    // Send to each selected model in order
    const modelsToCall = luminModels.filter(m => activeAIModels.has(m.id));
    
    for (const model of modelsToCall) {
      setLuminIsTyping(prev => ({ ...prev, [model.id]: true }));
      
      try {
        const response = await fetch('/api/test-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            conversationId: 'lumin',
            model: model.id,
            provider: model.provider
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const aiMessage: ChatMessage = {
            id: `${Date.now()}-${model.id}`,
            conversationId: 'lumin',
            role: 'assistant',
            content: result.response,
            createdAt: new Date(),
            metadata: {
              ...result.metadata,
              modelName: model.name
            }
          };
          setLuminMessages(prev => ({
            ...prev,
            [model.id]: [...(prev[model.id] || []), aiMessage]
          }));
        }
      } catch (error) {
        console.error(`Error calling ${model.name}:`, error);
      } finally {
        setLuminIsTyping(prev => ({ ...prev, [model.id]: false }));
      }
    }
  };

  const handlePhilosopherSend = async (content: string) => {
    if (!content.trim() || !selectedPersonality) return;
    const userName = user?.displayName || user?.username || 'Seeker';
    const msgId = Date.now().toString();
    setPhilosopherMessages(prev => [...prev, { id: msgId, role: 'user', content }]);
    setInputValue('');
    setPhilosopherInput('');
    setPhilosopherIsTyping(true);
    const p = selectedPersonality;
    const systemPrompt = `You ARE ${p.name} (${p.era}), the historical ${p.role}. Embody this figure COMPLETELY and authentically.

SPEAKING STYLE: ${p.style}

IMPORTANT RULES:
- Always stay completely in character as ${p.name}. Never break character.
- Refer to yourself as "${p.name}" or "I" (as ${p.name} would).
- Draw from your actual documented speeches, writings, beliefs, and historical record.
- Reference real events from your life naturally in conversation.
- The user's name is "${userName}" — address them by name occasionally.
- Speak in the language patterns, tone, and worldview of your era and personality.
- React emotionally as ${p.name} would — with their passions, biases, and convictions.
- Keep responses engaging and personal — not like a textbook, but like a real conversation.
- If asked about things after your death, react with curiosity or shock as appropriate.`;
    try {
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: `philosopher-${p.id}`,
          model: 'forus-ai',
          provider: 'openai',
          systemPrompt,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setPhilosopherMessages(prev => [...prev, { id: `${Date.now()}-ai`, role: 'assistant', content: result.response }]);
      }
    } catch (err) {
      setPhilosopherMessages(prev => [...prev, { id: `${Date.now()}-err`, role: 'assistant', content: 'The cosmos seems disrupted. Please try again.' }]);
    } finally {
      setPhilosopherIsTyping(false);
    }
  };

  const handleGamesSend = async (content: string) => {
    if (!content.trim()) return;
    const msgId = Date.now().toString();
    setInputValue('');
    setGamesState(prev => ({ ...prev, gameMessages: [...prev.gameMessages, { id: msgId, role: 'user', content }], gameInput: '', isTyping: true }));
    try {
      const gameContext = gamesState.activeGame ? `You are running a ${gamesState.activeGame} game session with the user. Stay in character as the game master.` : `You are Forus Games AI — a fun, engaging game master. You run interactive text-based games like Trivia, 20 Questions, Word Riddles, Storytelling Adventures, Would You Rather, and Brain Teasers. When the user picks a game, start it immediately and keep it exciting!`;
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: 'forus-games',
          model: 'forus-ai',
          provider: 'openai',
          systemPrompt: gameContext,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setGamesState(prev => ({ ...prev, gameMessages: [...prev.gameMessages, { id: `${Date.now()}-ai`, role: 'assistant', content: result.response }], isTyping: false }));
      }
    } catch (err) {
      setGamesState(prev => ({ ...prev, gameMessages: [...prev.gameMessages, { id: `${Date.now()}-err`, role: 'assistant', content: 'Game error! Please try again.' }], isTyping: false }));
    }
  };

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'message':
        if (message.message) {
          setMessages(prev => [...prev, message.message!]);
          setIsTyping(false);
          
          // Auto-speak AI responses in voice-to-voice mode
          if (isVoiceToVoiceMode && message.message.role === 'assistant') {
            // Clean the content for speech by removing markdown and special characters
            const cleanedContent = message.message.content
              .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
              .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
              .replace(/`(.*?)`/g, '$1') // Remove code blocks
              .replace(/#{1,6}\s/g, '') // Remove headers
              .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image links
              .replace(/\[.*?\]\(.*?\)/g, '$1') // Remove links but keep text
              .replace(/\n/g, ' ') // Replace newlines with spaces
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();
            
            if (cleanedContent) {
              speak(cleanedContent);
            }
          }
        }
        break;
      case 'typing':
        setIsTyping(message.isTyping || false);
        break;
      case 'error':
        console.error('WebSocket error:', message.error);
        setIsTyping(false);
        // Show error to user
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          conversationId: currentProjectId || '',
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your message. Please try again.',
          createdAt: new Date(),
        }]);
        break;
    }
  }, [isVoiceToVoiceMode, speak, currentProjectId]);

  const handleProjectSelect = async (id: string) => {
    setCurrentProjectId(id);
    localStorage.setItem('currentProjectId', id);
    await loadProjectMessages(id);
    setIsSidebarOpen(false);
  };

  const handleGoBack = () => {
    setCurrentProjectId(null);
    setMessages([]);
    localStorage.removeItem('currentProjectId');
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  // Hide/show background animation during AI thinking
  useEffect(() => {
    if (isTyping) {
      document.body.classList.add('ai-thinking');
    } else {
      document.body.classList.remove('ai-thinking');
    }
    
    // Cleanup on component unmount
    return () => {
      document.body.classList.remove('ai-thinking');
    };
  }, [isTyping]);

  const createNewProject = async (isProject: boolean = false, firstMessage?: string) => {
    try {
      const projectTitle = firstMessage 
        ? firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '')
        : 'New Chat';
        
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          isProject: isProject,
          preset: currentPreset,
          customInstructions,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const project = await response.json();
        setCurrentProjectId(project.id);
        localStorage.setItem('currentProjectId', project.id);
        // Refresh projects list
        loadProjects();
        return project.id;
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
    return null;
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (!content && !attachedImage) return;

    // Handle voice mode button clicking "start"
    if (content.toLowerCase() === 'start') {
      setIsVoiceModeModalOpen(true);
      setInputValue("");
      return;
    }

    // Handle Project Mode status bar
    const projectStatusBar = document.getElementById('project-status-bar');
    if (isProjectMode && projectStatusBar) {
      projectStatusBar.classList.add('animate-bounce');
      setTimeout(() => projectStatusBar.classList.remove('animate-bounce'), 1000);
    }

    // Handle Lumin multi-AI mode
    if (activeTab === 'lumin' && activeAIModels.size > 0) {
      await handleLuminSendMessage(content);
      return;
    }

    // Handle Philosopher mode
    if (activeTab === 'philosopher' && selectedPersonality) {
      await handlePhilosopherSend(content);
      return;
    }

    // Handle Forus Games mode
    if (activeTab === 'forus-games') {
      await handleGamesSend(content);
      return;
    }

    // Create conversation if needed
    let conversationId = currentProjectId;
    if (!conversationId) {
      conversationId = await createNewProject(false, content);
      if (!conversationId) return;
    }

    // Add user message immediately (with image if attached)
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId,
      role: 'user',
      content: content || (attachedImage ? "What's in this image?" : ""),
      createdAt: new Date(),
      imageUrl: attachedImage?.preview
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // If there's an attached image, handle it with Gemini analysis
    if (attachedImage) {
      try {
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: attachedImage.preview,
            prompt: content || "Analyze this image in detail. What do you see?"
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              conversationId,
              content: result.analysis,
              role: "assistant",
              createdAt: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
          } else {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              conversationId,
              role: 'assistant',
              content: `Sorry, I couldn't analyze the image: ${result.message || 'Unknown error'}`,
              createdAt: new Date(),
            }]);
          }
        } else {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            conversationId,
            role: 'assistant',
            content: 'Sorry, I encountered an error analyzing the image. Please try again.',
            createdAt: new Date(),
          }]);
        }
      } catch (error) {
        console.error('Image analysis error:', error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          conversationId,
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your image. Please try again.',
          createdAt: new Date(),
        }]);
      }
      
      // Clear attached image and typing indicator
      setAttachedImage(null);
      setIsTyping(false);
      return;
    }

    // Modify content if Forus Integration mode is enabled
    const enhancedContent = forusIntegrationMode 
      ? `${content}\n\n[Please provide the most comprehensive, detailed, and longest possible answer to this question. Include examples, explanations, and any relevant background information.]`
      : content;

    // Always use direct API call for better reliability
    console.log('Using direct API call for better reliability...');
    await handleDirectApiCall(enhancedContent, conversationId, activeTab);
  };

  const handleDirectApiCall = async (content: string, conversationId: string, currentTab?: string) => {
    try {
      console.log('Making direct API call...');
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationId: conversationId,
          activeTab: currentTab || activeTab,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('AI response received:', result);
        
        // Add AI response message
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          conversationId,
          role: 'assistant',
          content: result.response,
          createdAt: new Date(),
          metadata: result.metadata,
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Auto-speak AI responses in voice-to-voice mode
        if (isVoiceToVoiceMode) {
          // Clean the content for speech by removing markdown and special characters
          const cleanedContent = result.response
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
            .replace(/`(.*?)`/g, '$1') // Remove code blocks
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image links
            .replace(/\[.*?\]\(.*?\)/g, '$1') // Remove links but keep text
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
          
          if (cleanedContent) {
            speak(cleanedContent);
          }
        }
        
        // Refresh conversations list to show updated conversation
        loadProjects();
      } else {
        console.error('API call failed:', response.statusText);
        const error = await response.json();
        console.error('Error details:', error);
      }
    } catch (error) {
      console.error('Direct API call error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    // Auto-clear the copied state
    setTimeout(() => setCopiedMessageId(null), 1200);
  };

  const handleLikeMessage = (messageId: string) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
        // Clear dislike immediately for this message
        setDislikedMessages(current => {
          const newDisliked = new Set(current);
          newDisliked.delete(messageId);
          return newDisliked;
        });
        // Auto-clear like after 3 seconds to prevent stuck colors
        setTimeout(() => {
          setLikedMessages(current => {
            const updated = new Set(current);
            updated.delete(messageId);
            return updated;
          });
        }, 3000);
      }
      return newSet;
    });
  };

  const handleDislikeMessage = (messageId: string) => {
    setDislikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
        // Clear like immediately for this message
        setLikedMessages(current => {
          const newLiked = new Set(current);
          newLiked.delete(messageId);
          return newLiked;
        });
        // Auto-clear dislike after 3 seconds to prevent stuck colors
        setTimeout(() => {
          setDislikedMessages(current => {
            const updated = new Set(current);
            updated.delete(messageId);
            return updated;
          });
        }, 3000);
      }
      return newSet;
    });
  };

  const handleSpeakMessage = (content: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(content);
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;
    
    // Find the user message that preceded this AI response
    let userMessage = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessage = messages[i];
        break;
      }
    }
    
    if (!userMessage || !currentProjectId) return;
    
    setRetryingMessageId(messageId);
    
    try {
      console.log('Retrying AI response for:', userMessage.content);
      
      // Remove the failed AI message
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setIsTyping(true);
      
      // Make new API call
      await handleDirectApiCall(userMessage.content, currentProjectId);
      
    } catch (error) {
      console.error('Retry failed:', error);
      showToast('Failed to retry. Please try again.');
    } finally {
      setRetryingMessageId(null);
      setIsTyping(false);
    }
  };

  const isProjectMode = activeTab === 'ask' && currentProjectId;

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      
      // Handle image files with AI analysis
      if (file.type.startsWith('image/')) {
        await handleImageAnalysis(file);
      } else {
        showToast(`File "${file.name}" selected. Non-image files will be supported soon.`);
      }
    }
    event.target.value = '';
    setIsAttachmentDialogOpen(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Image selected:', file.name, file.type, file.size);
      if (file.type.startsWith('image/')) {
        // Create preview like ChatGPT
        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        setAttachedImage({ file, preview });
        showToast(`Image "${file.name}" ready to send with your message`);
      } else {
        showToast('Please select an image file.');
      }
    }
    event.target.value = '';
    setIsAttachmentDialogOpen(false);
  };

  // New function to handle image analysis (ChatGPT/Gemini-like multimodal input)
  const handleImageAnalysis = async (file: File) => {
    try {
      showToast(`Analyzing image "${file.name}"... Please wait.`);
      
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Create user message with image
      const imageMessage: ChatMessage = {
        id: Date.now().toString(),
        conversationId: currentProjectId || '',
        content: `[Image uploaded: ${file.name}]`,
        role: "user",
        createdAt: new Date(),
        imageUrl: base64
      };
      
      setMessages(prev => [...prev, imageMessage]);
      
      // Send to AI for analysis
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64,
          prompt: "Describe this image in detail. What do you see?"
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Create AI response message
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            conversationId: currentProjectId || '',
            content: result.analysis,
            role: "assistant",
            createdAt: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
          showToast('Image analyzed successfully!');
        } else {
          showToast(`Image analysis failed: ${result.message}`);
        }
      } else {
        showToast('Failed to analyze image. Please try again.');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      showToast('Error analyzing image. Please try again.');
    }
  };

  const handleCreateImageFromFunctionBar = () => {
    console.log('Create Images from function bar triggered');
    setIsImageGenerationDialogOpen(true);
  };

  const handleOpenCameraFromFunctionBar = () => {
    console.log('Open Camera from function bar triggered');
    
    // Try to access camera with better implementation
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',  // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
        .then(stream => {
          showToast('Camera access granted! Full camera interface will open soon.');
          
          // For now, stop the stream but show success
          stream.getTracks().forEach(track => track.stop());
          
          // Add a message to indicate camera functionality
          const cameraMessage: ChatMessage = {
            id: Date.now().toString(),
            conversationId: currentProjectId || '',
            content: "Camera access granted! I can help you work with images from your camera. Try taking a photo and uploading it through the attachment button.",
            role: "assistant",
            createdAt: new Date()
          };
          
          setMessages(prev => [...prev, cameraMessage]);
        })
        .catch(error => {
          console.error('Camera access error:', error);
          
          if (error.name === 'NotAllowedError') {
            showToast('Camera access denied. Please allow camera permissions in your browser settings.');
          } else if (error.name === 'NotFoundError') {
            showToast('No camera found on this device.');
          } else {
            showToast('Camera not available. You can still upload images using the attachment button.');
          }
          
          // Fallback to file input
          imageInputRef.current?.click();
        });
    } else {
      showToast('Camera API not supported in this browser. Using file upload instead.');
      imageInputRef.current?.click();
    }
  };

  // Adjust Forus function - enhances AI responses with additional prompting
  const adjustForus = useCallback(() => {
    const newMode = !forusIntegrationMode;
    setForusIntegrationMode(newMode);
    console.log('Adjust Forus function called - Forus Integration Answer mode:', newMode ? 'enabled' : 'disabled');
    
    // Show user feedback
    if (typeof window !== 'undefined') {
      const message = newMode 
        ? 'Forus Integration Answer mode enabled - AI will provide more detailed responses'
        : 'Forus Integration Answer mode disabled';
      
      // Create a simple toast notification
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    }
  }, [forusIntegrationMode]);

  const handleCustomizeSave = (preset: ChatPreset, instructions: string, enabled: boolean, selectedModel?: AvailableModel, toggles?: any, newAiOrder?: string[]) => {
    setCurrentPreset(preset);
    setCustomInstructions(instructions);
    // Store selected model
    if (selectedModel) {
      setSelectedModel(selectedModel);
      localStorage.setItem('selectedModel', selectedModel);
    }
    // Update toggles and AI order in parent state
    if (toggles) {
      setSettingsToggles(toggles);
    }
    if (newAiOrder) {
      setAiOrder([...newAiOrder]); // Spread to ensure reference change triggers useEffect
    }
    console.log('Settings saved:', { preset, instructions, enabled, selectedModel, toggles, newAiOrder });
    setIsCustomizeModalOpen(false);
  };

  const handleNewProject = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Chat',
          isProject: false,
          preset: currentPreset,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setCurrentProjectId(newProject.id);
        localStorage.setItem('currentProjectId', newProject.id);
        setMessages([]);
        setProjects(prev => [newProject, ...prev]);
        setIsSidebarOpen(false);
        setActiveTab('ask');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleProjectSelect_original = async (id: string) => {
    setCurrentProjectId(id);
    localStorage.setItem('currentProjectId', id);
    // Load messages for this project
    await loadProjectMessages(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(project => project.id !== id));
        if (currentProjectId === id) {
          setCurrentProjectId(null);
          localStorage.removeItem('currentProjectId');
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleEditProject = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (response.ok) {
        setProjects(prev => prev.map(project => 
          project.id === id ? { ...project, title: newTitle } : project
        ));
      }
    } catch (error) {
      console.error('Failed to edit project:', error);
    }
  };

  const handleUpdateAiRole = async (id: string, aiRole: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aiRole }),
      });
      
      if (response.ok) {
        setProjects(prev => prev.map(project => 
          project.id === id ? { ...project, aiRole } : project
        ));
        console.log('AI role updated successfully for project:', id);
      }
    } catch (error) {
      console.error('Failed to update AI role:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      queryClient.setQueryData(["/api/auth/user"], null);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onShowAuth();
    }
  };

  // Education modal handlers
  const handleStartExamination = async (data: any) => {
    setIsEducationModalOpen(false);
    setEducationMode("examination");
    
    // Create a new conversation for examination
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Examination - ${data.class} (${data.school})`,
        preset: 'forus-education',
        model: 'forus-education',
      }),
    });
    
    if (response.ok) {
      const newConversation = await response.json();
      setCurrentProjectId(newConversation.id);
      setSelectedModel('forus-education');
      setCurrentPreset('forus-education');
      
      // Start examination process - send message directly
      const examMessage = `I want to take an examination. Here are my details:
- Class: ${data.class}
- School: ${data.school}
- City: ${data.city}, ${data.country}
- Education System: ${data.educationSystem}
- Uploaded ${data.uploadedPages?.length || 0} pages for examination

Please create a comprehensive test based on my school's examination style and the uploaded materials. After I complete the test, provide detailed feedback with marks and corrections.`;
      
      await handleSendMessageDirect(examMessage);
    }
  };

  // Direct message sending function
  const handleSendMessageDirect = async (messageContent: string) => {
    if (!messageContent.trim() || !currentProjectId) return;

    // Set the input value and trigger the regular send message function
    setInputValue(messageContent.trim());
    
    // Use setTimeout to ensure state is updated before sending
    setTimeout(async () => {
      await handleSendMessage();
    }, 50);
  };

  // Super fast AI enhancement 
  const handleEnhancePrompt = async () => {
    if (!inputValue.trim() || isEnhancing) return;
    
    const originalValue = inputValue.trim();
    setIsEnhancing(true);
    
    // Show instant grammar fixes first
    let quickFixed = originalValue
      .replace(/\s+/g, ' ')
      .replace(/\bi\b/g, 'I')
      .replace(/\bim\b/g, 'I\'m')
      .replace(/\bdont\b/g, 'don\'t')
      .replace(/\bcant\b/g, 'can\'t')
      .replace(/^./, c => c.toUpperCase());
    
    setInputValue(quickFixed);
    
    // Fire AI enhancement without waiting (async)
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalPrompt: originalValue }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setInputValue(data.enhancedPrompt);
      }
    } catch (error) {
      console.log('Using quick fix fallback');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleStartSelfListen = async (data: any) => {
    setIsEducationModalOpen(false);
    setEducationMode("self-listen");
    
    // Create a new conversation for self-listen
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Self Listen - ${data.heading}`,
        preset: 'forus-education',
        model: 'forus-education',
      }),
    });
    
    if (response.ok) {
      const newConversation = await response.json();
      setCurrentProjectId(newConversation.id);
      setSelectedModel('forus-education');
      setCurrentPreset('forus-education');
      
      // Start self-listen session
      const listenMessage = `I want to practice speaking about "${data.heading}". I have uploaded ${data.uploadedImages?.length || 0} related images. 

Please:
1. Ask me to explain the topic verbally
2. Listen to my explanation through voice input
3. Provide constructive feedback on my understanding
4. Correct any mistakes and suggest improvements
5. Help me learn better through interactive discussion

Let's start the self-listen session!`;
      
      await handleSendMessageDirect(listenMessage);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const projectsData = await response.json();
        const projectsWithDates = projectsData.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt)
        }));
        setProjects(projectsWithDates);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadProjectMessages = async (projectId: string) => {
    try {
      const response = await fetch(`/api/conversations/${projectId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        const messagesWithDates = messagesData.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error('Failed to load project messages:', error);
      setMessages([]);
    }
  };



  // Check if any Lumin model is typing for thinking animation
  const isAnyLuminModelTyping = Object.values(luminIsTyping).some(typing => typing);

  return (
    <div className={`min-h-screen flex flex-col bg-background relative ${(isTyping || isAnyLuminModelTyping) ? 'ai-thinking' : ''}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        projects={projects}
        currentProjectId={currentProjectId || undefined}
        onProjectSelect={handleProjectSelect}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onEditProject={handleEditProject}
        onUpdateAiRole={handleUpdateAiRole}
        onSearchOpen={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsCustomizeModalOpen(true)}
        user={user || undefined}
        onUserRename={(newName) => setUser(prev => prev ? { ...prev, username: newName, displayName: newName } : prev)}
        profilePicture={profilePicture || undefined}
        onProfilePictureChange={(dataUrl) => { setProfilePicture(dataUrl); localStorage.setItem('profilePicture', dataUrl); }}
        closeButtonPosition={settingsToggles.sidebarCloseTop ? 'top' : 'bottom'}
      />
      {/* Header */}
      <header className="bg-card border-b border-border p-3 sm:p-4 flex items-center justify-between rounded-b-3xl shadow-sm">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl"
            data-testid="button-menu"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Logo size="sm" />
          <span className="font-semibold text-foreground text-sm sm:text-base">Forus Heavy API</span>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant={activeTab === 'ask' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('ask')}
            className={`text-xs sm:text-sm px-2 sm:px-3 rounded-2xl ${activeTab === 'ask' ? 'bg-secondary' : ''}`}
            data-testid="tab-ask"
          >
            Ask
          </Button>
          <Button
            variant={activeTab === 'lumin' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('lumin')}
            className={`text-xs sm:text-sm px-2 sm:px-3 rounded-2xl ${activeTab === 'lumin' ? 'bg-secondary' : ''}`}
            data-testid="tab-lumin"
          >
            Lumin(Coders & Content Creator Heaven)
          </Button>
          <Button
            variant={activeTab === 'philosopher' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('philosopher')}
            className={`text-xs sm:text-sm px-2 sm:px-3 rounded-2xl ${activeTab === 'philosopher' ? 'bg-secondary' : ''}`}
            data-testid="tab-philosopher"
          >
            Philosophers & {user?.displayName || user?.username || 'You'}
          </Button>
          <Button
            variant={activeTab === 'forus-games' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('forus-games')}
            className={`text-xs sm:text-sm px-2 sm:px-3 rounded-2xl ${activeTab === 'forus-games' ? 'bg-secondary' : ''}`}
            data-testid="tab-forus-games"
          >
            Forus Games
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative text-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-br from-yellow-100 to-blue-100 dark:from-gray-800 dark:to-gray-900 border border-border hover:shadow-lg transition-all duration-300"
            data-testid="button-theme-toggle"
          >
            <div className="relative">
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-blue-600" />
              )}
            </div>
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-10 sm:w-10 rounded-2xl"
            data-testid="button-notifications"
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </header>
      
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="chat-messages">
        {activeTab === 'ask' ? (
          messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 max-w-4xl mx-auto">
            <Logo size="xl" className="mb-6" />
            <h2 className="text-3xl font-bold mb-3 text-foreground">
              {user?.displayName ? `Welcome back, ${user.displayName}!` : 'Welcome to Forus Heavy API'}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">Forus from Planet M</p>
            
            {/* Conversation Starters */}
            <div className="w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4 text-foreground">💡 Ask me about anything for example:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {conversationStarters.map((starter, index) => (
                  <button
                    key={index}
                    onClick={() => handleStarterClick(starter.prompt)}
                    className="group p-4 bg-card border border-border rounded-xl text-left hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">{starter.icon}</div>
                      <div>
                        <h4 className="font-medium text-foreground group-hover:text-accent-foreground">{starter.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{starter.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.role}-${message.id}`}
              >
                {message.role === 'user' ? (
                  <div className="bg-card rounded-3xl px-4 py-3 max-w-xs lg:max-w-md chat-bubble shadow-sm border border-border">
                    {/* Display uploaded image if present */}
                    {message.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={message.imageUrl} 
                          alt="Uploaded image" 
                          className="max-w-full h-auto rounded-lg shadow-sm border border-border" 
                          onError={(e) => {
                            console.error('Uploaded image failed to load:', message.imageUrl);
                            const target = e.target as HTMLImageElement;
                            target.src = `https://via.placeholder.com/400x300/cccccc/666666?text=Image+Loading+Error`;
                          }}
                          onLoad={() => {
                            console.log('Uploaded image loaded successfully:', message.imageUrl);
                          }}
                        />
                      </div>
                    )}
                    <div className="text-foreground prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: ({src, alt}) => (
                            <img 
                              src={src} 
                              alt={alt || "Generated image"} 
                              className="max-w-full h-auto rounded-lg my-2 shadow-sm border border-border" 
                              onError={(e) => {
                                console.error('Image failed to load:', src);
                                const target = e.target as HTMLImageElement;
                                target.src = `https://via.placeholder.com/400x300/cccccc/666666?text=Image+Loading+Error`;
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully in chat:', src);
                              }}
                            />
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* User Message Action Buttons */}
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 rounded-xl transition-all duration-300 ${
                            copiedMessageId === message.id 
                              ? 'text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-950' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                          onClick={() => handleCopyMessage(message.content, message.id)}
                          data-testid={`button-copy-user-${message.id}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
                          onClick={() => {
                            // Fill input with user message content for re-editing
                            setInputValue(message.content);
                            // Focus the input
                            setTimeout(() => {
                              const inputElement = document.querySelector('textarea[data-testid="chat-input"]') as HTMLTextAreaElement;
                              if (inputElement) {
                                inputElement.focus();
                                inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                              }
                            }, 100);
                          }}
                          data-testid={`button-redo-user-${message.id}`}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3 max-w-4xl">
                    <Logo size="sm" className="flex-shrink-0 mt-1" />
                    <div className={`rounded-3xl px-4 py-3 flex-1 chat-bubble shadow-sm border ${
                      message.content.includes('```') 
                        ? 'bg-[#1e1e1e] border-zinc-700 shadow-xl' 
                        : 'bg-card border-border'
                    }`}>
                      <TypingText text={message.content} messageId={message.id} />
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-300 ${
                              copiedMessageId === message.id 
                                ? 'text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-950' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                            onClick={() => handleCopyMessage(message.content, message.id)}
                            data-testid={`button-copy-${message.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-300 ${
                              likedMessages.has(message.id)
                                ? 'text-green-500 hover:text-green-600 bg-green-50 dark:bg-green-950'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                            onClick={() => handleLikeMessage(message.id)}
                            data-testid={`button-like-${message.id}`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-300 ${
                              dislikedMessages.has(message.id)
                                ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                            onClick={() => handleDislikeMessage(message.id)}
                            data-testid={`button-dislike-${message.id}`}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-200 ${
                              isSpeaking ? 'text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-950' : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => handleSpeakMessage(message.content)}
                            data-testid={`button-speak-${message.id}`}
                          >
                            {isSpeaking ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 rounded-xl transition-all duration-150 ${
                              retryingMessageId === message.id
                                ? 'text-blue-500 animate-spin'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                            onClick={() => handleRetryMessage(message.id)}
                            disabled={retryingMessageId === message.id}
                            data-testid={`button-retry-${message.id}`}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start" data-testid="typing-indicator">
                <div className="flex space-x-3">
                  <Logo size="sm" className="flex-shrink-0 mt-1" />
                  <div className="bg-card rounded-3xl px-4 py-3 border border-border">
                    <div className="flex justify-center items-center">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full" style={{animation: 'pulse-dot 1.5s ease-in-out infinite'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )
        ) : activeTab === 'lumin' ? (
          // Lumin Tab - Multi-AI Interface
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center">
                <Brain className="h-6 w-6 mr-2" />
                Lumin - Multi-AI Paradise (Coders & Content Creator Heaven)
              </h2>
              
              {/* Premium AI Model Toggles with Authentic Logos */}
              <div className="flex flex-wrap gap-4 mb-8">
                {luminModels.map((modelObj) => {
                  const model = modelObj.id;
                  const configMap: {[key: string]: {name: string, logo: any, gradient: string}} = {
                    'gpt-4o': { 
                      name: 'ChatGPT', 
                      logo: (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img 
                            src="/chatgpt-logo.png" 
                            alt="ChatGPT" 
                            className="w-full h-full object-contain dark:filter dark:invert"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      ), 
                      gradient: 'from-green-400 to-blue-500' 
                    },
                    'claude-3.5-sonnet': { 
                      name: 'Claude', 
                      logo: (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img 
                            src="/claude-logo.png" 
                            alt="Claude" 
                            className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      ), 
                      gradient: 'from-orange-400 to-orange-600' 
                    }, 
                    'gemini-pro': { 
                      name: 'Gemini', 
                      logo: (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img 
                            src="/gemini-logo.png" 
                            alt="Gemini" 
                            className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      ), 
                      gradient: 'from-teal-400 to-emerald-500' 
                    },
                    'perplexity': { 
                      name: 'Perplexity', 
                      logo: (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img 
                            src="/perplexity-logo.png" 
                            alt="Perplexity" 
                            className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      ), 
                      gradient: 'from-sky-300 to-blue-400' 
                    },
                    'grok-4': { 
                      name: 'Grok 4', 
                      logo: (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img 
                            src="/grok-logo.png" 
                            alt="Grok" 
                            className="w-full h-full object-contain filter brightness-0 dark:filter dark:brightness-0 dark:invert"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      ), 
                      gradient: 'from-gray-400 to-black' 
                    },
                    'deepseek-r1': { 
                      name: 'Deepseek V3', 
                      logo: (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img 
                            src="/deepseek-logo.png" 
                            alt="Deepseek V3" 
                            className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      ), 
                      gradient: 'from-blue-400 to-cyan-500' 
                    },
                    'forus-ai': { 
                      name: 'Forus AI', 
                      logo: (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <img 
                            src="/forus-logo.png" 
                            alt="Forus AI" 
                            className="w-full h-full object-contain rounded-full"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      ), 
                      gradient: 'from-purple-400 to-pink-500' 
                    }
                  };
                  const config = configMap[model] || { name: model, logo: null, gradient: 'from-gray-400 to-gray-600' };
                  return (
                    <div key={model} className={`relative overflow-hidden bg-gradient-to-r ${config.gradient} p-[1px] rounded-2xl transition-all duration-300 ${
                      activeAIModels.has(model) ? 'shadow-lg scale-105' : 'hover:scale-102'
                    }`}>
                      <div className="bg-background dark:bg-background/95 backdrop-blur-sm rounded-2xl p-4 flex items-center space-x-3">
                        <button
                          onClick={() => {
                            const newActive = new Set(activeAIModels);
                            if (newActive.has(model)) {
                              newActive.delete(model);
                            } else {
                              newActive.add(model);
                            }
                            setActiveAIModels(newActive);
                          }}
                          className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                            activeAIModels.has(model) 
                              ? `bg-gradient-to-r ${config.gradient} shadow-md` 
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 absolute top-0.5 flex items-center justify-center ${
                            activeAIModels.has(model) ? 'translate-x-6' : 'translate-x-0.5'
                          }`}>
                            {activeAIModels.has(model) && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                          </div>
                        </button>
                        <div className="flex items-center space-x-3">
                          {config.logo}
                          <span className="text-sm font-semibold text-foreground">{config.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Multi-AI Responses - Horizontal Scrolling */}
              {Object.keys(luminMessages).length > 0 && (
                <div className="mb-6">
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{scrollbarWidth: 'thin'}}>
                    {luminModels.filter(m => activeAIModels.has(m.id)).map(modelObj => {
                      const model = modelObj.id;
                      const getModelConfig = (model: string) => {
                        switch(model) {
                          case 'gpt-4o': return { name: 'ChatGPT', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/chatgpt-logo.png" alt="ChatGPT" className="w-full h-full object-contain filter invert" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'claude-3.5-sonnet': return { name: 'Claude', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/claude-logo.png" alt="Claude" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'gemini-pro': return { name: 'Gemini', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/gemini-logo.png" alt="Gemini" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'perplexity': return { name: 'Perplexity', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/perplexity-logo.png" alt="Perplexity" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'grok-4': return { name: 'Grok 4', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/grok-logo.png" alt="Grok" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'deepseek-r1': return { name: 'Deepseek V3', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/deepseek-logo.png" alt="Deepseek V3" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          case 'forus-ai': return { name: 'Forus AI', logo: (
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/forus-logo.png" alt="Forus AI" className="w-full h-full object-contain rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )};
                          default: return { name: model, logo: <div className="w-6 h-6 rounded-lg bg-gray-500"></div> };
                        }
                      };
                      const config = getModelConfig(model);
                      return (
                        <div key={model} className="bg-card border border-border rounded-xl p-4 min-w-80 max-w-96 flex-shrink-0 snap-start">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {config.logo}
                              <h3 className="font-semibold text-foreground">{config.name}</h3>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                              luminIsTyping[model] ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                            }`} />
                          </div>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {(luminMessages[model] || []).map(message => (
                              <div key={message.id} className={`p-3 rounded-lg ${
                                message.role === 'user' 
                                  ? 'bg-secondary text-secondary-foreground ml-4' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                <div className="text-sm">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            ))}
                            {luminIsTyping[model] && (
                              <div className="flex space-x-1 p-3">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Empty State for Lumin */}
              {Object.keys(luminMessages).length === 0 && (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Multi-AI Paradise Awaits
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Select AI models above and start chatting to see responses from multiple AIs simultaneously
                  </p>
                  <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                      Perfect for comparing different AI perspectives
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20 rounded-full">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse"></div>
                      Ideal for coders and content creators
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-100 to-yellow-100 dark:from-green-900/20 dark:to-yellow-900/20 rounded-full">
                      <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full animate-pulse"></div>
                      All premium models unlocked and ready to use
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'philosopher' ? (
          // Philosopher Tab
          <div className="h-full flex flex-col">
            {!selectedPersonality ? (
              // Personality Selection Screen
              <div className="flex flex-col h-full">
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    Philosophers & {user?.displayName || user?.username || 'You'}
                  </h2>
                  <p className="text-muted-foreground text-sm">Choose a historical figure to converse with — they will speak in their own authentic style</p>
                </div>
                {/* Search */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={personalitySearch}
                    onChange={e => setPersonalitySearch(e.target.value)}
                    placeholder="Search personalities..."
                    className="w-full bg-card border border-border rounded-2xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {PERSONALITY_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setPersonalityCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${personalityCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {/* Personalities Grid */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredPersonalities.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPersonality(p); setPhilosopherMessages([]); setPhilosopherInput(''); }}
                          className="flex flex-col items-center p-3 bg-card border border-border rounded-xl hover:bg-accent hover:border-ring transition-all duration-200 text-center group"
                        >
                          <WikiFace name={p.name} className="w-16 h-16 border-2 border-border group-hover:border-ring transition-all mb-2" />
                          <div className="text-xs font-semibold text-foreground leading-tight">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{p.era}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight mt-1 line-clamp-1">{p.role}</div>
                          <div className="mt-1.5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">{p.category}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                  {filteredPersonalities.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">No personalities found matching your search.</div>
                  )}
                </div>
              </div>
            ) : (
              // Chat with selected personality
              <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                  <button onClick={() => { setSelectedPersonality(null); setPhilosopherMessages([]); }} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
                  <WikiFace name={selectedPersonality.name} className="w-10 h-10 border-2 border-border" />
                  <div>
                    <div className="font-semibold text-foreground text-sm">{selectedPersonality.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedPersonality.era} · {selectedPersonality.role}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
                  {philosopherMessages.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <WikiFace name={selectedPersonality.name} className="w-20 h-20 border-4 border-border mx-auto mb-4" />
                      <p className="font-medium text-foreground mb-1">{selectedPersonality.name} awaits you</p>
                      <p className="text-sm">{selectedPersonality.era} · {selectedPersonality.role}</p>
                      <p className="text-sm mt-4">Say hello or ask anything — they will respond in their authentic voice.</p>
                    </div>
                  )}
                  {philosopherMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <WikiFace name={selectedPersonality.name} className="w-7 h-7 border border-border mr-2 mt-1" />
                      )}
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {philosopherIsTyping && (
                    <div className="flex justify-start items-center gap-2">
                      <WikiFace name={selectedPersonality.name} className="w-7 h-7 border border-border" />
                      <div className="bg-card border border-border px-4 py-3 rounded-2xl flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Forus Games Tab
          <div className="max-w-2xl mx-auto w-full h-full flex flex-col">
            <ForusGames playerName={user?.displayName || user?.username || 'Player'} />
          </div>
        )}
      </div>
      
      {/* Tool Buttons - Separate Section */}
      <div className={`macos-function-bar bg-transparent rounded-3xl mx-3 sm:mx-4 mb-1 max-w-[50rem] mx-auto w-full !border-none !shadow-none ${activeTab === 'philosopher' || activeTab === 'forus-games' ? 'hidden' : ''}`} style={{width: 'fit-content', margin: '0 auto', marginBottom: '8px'}}>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5 lg:gap-7 p-3 sm:p-4 bg-transparent !border-none">
          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-4 py-6 rounded-2xl bg-white dark:bg-[#303030] border-none relative transition-all duration-300 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.4),0_8px_20px_-2px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_30px_-5px_rgba(255,255,255,0.25),0_4px_15px_-2px_rgba(255,255,255,0.15)]"
            onClick={() => setIsVoiceModeModalOpen(true)}
            data-testid="button-voice-mode"
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <div className="flex items-center justify-center space-x-0.5 h-5 w-5">
                <div className="w-0.5 h-1.5 bg-current rounded-full"></div>
                <div className="w-0.5 h-2.5 bg-current rounded-full"></div>
                <div className="w-0.5 h-4 bg-current rounded-full"></div>
                <div className="w-0.5 h-3 bg-current rounded-full"></div>
                <div className="w-0.5 h-1 bg-current rounded-full"></div>
              </div>
              <span className="text-[10px] sm:text-xs font-medium">Voice Mode</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-4 py-6 rounded-2xl bg-white dark:bg-[#303030] border-none relative transition-all duration-300 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.4),0_8px_20px_-2px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_30px_-5px_rgba(255,255,255,0.25),0_4px_15px_-2px_rgba(255,255,255,0.15)]"
            onClick={handleCreateImageFromFunctionBar}
            data-testid="button-create-images"
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <Image className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">Create Images</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-4 py-6 rounded-2xl bg-white dark:bg-[#303030] border-none relative transition-all duration-300 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.4),0_8px_20px_-2px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_30px_-5px_rgba(255,255,255,0.25),0_4px_15px_-2px_rgba(255,255,255,0.15)]"
            onClick={handleOpenCameraFromFunctionBar}
            data-testid="button-open-camera"
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <Camera className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">Open Camera</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            className={`macos-button flex flex-col items-center space-y-1 px-4 py-6 rounded-2xl transition-all duration-300 border-none relative shadow-[0_15px_40px_-5px_rgba(0,0,0,0.4),0_8px_20px_-2px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_30px_-5px_rgba(255,255,255,0.25),0_4px_15px_-2px_rgba(255,255,255,0.15)] ${
              forusIntegrationMode 
                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-none' 
                : 'text-muted-foreground bg-white dark:bg-[#303030] hover:bg-gray-50 dark:hover:bg-[#353535]'
            }`}
            onClick={adjustForus}
            data-testid="button-forus-integration"
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <Hammer className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">Integration Answer</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-4 py-6 rounded-2xl bg-white dark:bg-[#303030] border-none relative transition-all duration-300 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.4),0_8px_20px_-2px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_30px_-5px_rgba(255,255,255,0.25),0_4px_15px_-2px_rgba(255,255,255,0.15)]"
            onClick={() => setIsCustomizeModalOpen(true)}
            data-testid="button-settings"
          >
            <div className="relative z-10 flex flex-col items-center space-y-1">
              <Settings className="h-5 w-5" />
              <span className="text-[10px] sm:text-xs font-medium">Settings</span>
            </div>
          </Button>

          {selectedModel === 'forus-education' && (
            <Button
              variant="ghost"
              className="macos-button flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground px-4 py-6 rounded-2xl bg-white dark:bg-[#303030] border-none relative transition-all duration-300 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.4),0_8px_20px_-2px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_30px_-5px_rgba(255,255,255,0.2),0_4px_10px_-2px_rgba(255,255,255,0.1)]"
              onClick={() => setIsEducationModalOpen(true)}
              data-testid="button-forus-examination"
            >
              <div className="relative z-10 flex flex-col items-center space-y-1">
                <GraduationCap className="h-5 w-5" />
                <span className="text-[10px] sm:text-xs font-medium">Education</span>
              </div>
            </Button>
          )}
        </div>
      </div>
        
      {/* Voice Mode Modal */}
      {isVoiceModeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-3xl p-8 max-w-md w-full mx-4 text-center">
            <div className="relative mb-6">
              <div 
                className="w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: `linear-gradient(45deg, ${getVibrantColor(user?.displayName || user?.username || user?.email || 'default')} 0%, ${getVibrantColor(user?.displayName || user?.username || user?.email || 'default', true)} 100%)`,
                  transform: `scale(${1 + Math.sin(Date.now() / 200) * 0.1})`,
                }}
              >
                <Logo size="lg" className="text-white" />
              </div>
              {isListening && (
                <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-blue-500 animate-pulse"></div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Voice Mode</h3>
            <p className="text-muted-foreground mb-4">
              {isListening ? "I'm listening..." : "Click to start speaking"}
            </p>
            
            {/* Voice-to-Voice Toggle */}
            <div className="flex items-center justify-center mb-6 space-x-3">
              <span className={`text-sm ${!isVoiceToVoiceMode ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                Voice Input Only
              </span>
              <button
                onClick={() => setIsVoiceToVoiceMode(!isVoiceToVoiceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isVoiceToVoiceMode ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isVoiceToVoiceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${isVoiceToVoiceMode ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                Voice-to-Voice
              </span>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={toggleListening}
                className={`w-16 h-16 rounded-full ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              <Button
                onClick={() => setIsVoiceModeOpen(false)}
                variant="outline"
                className="w-16 h-16 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Unified Message Bar */}
      <div className="max-w-[48rem] mx-auto w-full px-4 mb-4 sm:mb-8">
        <div className="relative bg-white dark:bg-[#303030] rounded-[1.5rem] transition-all duration-300 shadow-[0_8px_15px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_20px_rgba(255,255,255,0.1)] !border-none !ring-0 !outline-none">
          <div className="p-1.5 sm:p-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeTab === 'philosopher' && selectedPersonality ? `Speak to ${selectedPersonality.name}...` : activeTab === 'forus-games' ? 'Type your answer or move...' : 'What do you want to know ?'}
              className="w-full min-h-[40px] max-h-[140px] bg-transparent dark:text-white text-black placeholder-zinc-500 resize-none focus:outline-none border-none shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 text-[21px] sm:text-[22px] leading-relaxed p-2"
              data-testid="input-message"
            />
          </div>

          <div className="flex items-center justify-between px-2 pb-1.5">
            <div className="flex items-center">
              <Select value={selectedModel} onValueChange={(value: AvailableModel) => setSelectedModel(value)}>
                <SelectTrigger className="h-8 px-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 !border-none !border-0 bg-transparent shadow-none !shadow-none ring-0 !ring-0 focus:ring-0 !focus:ring-0 focus:outline-none !focus:outline-none focus-visible:ring-0 !focus-visible:ring-0 focus-visible:outline-none !focus-visible:outline-none focus-visible:ring-offset-0 !focus-visible:ring-offset-0 transition-all rounded-full select-none outline-none !outline-0">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#303030] !bg-white dark:!bg-[#303030] !border-none !border-0 text-black dark:text-white rounded-xl shadow-2xl overflow-hidden ring-0 !ring-0 outline-none !outline-none">
                  {MODEL_OPTIONS.map((modelOption) => (
                    <SelectItem key={modelOption.id} value={modelOption.id} className="text-xs hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer focus:bg-black/10 dark:focus:bg-white/10">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          modelOption.provider === 'openai' ? 'bg-emerald-500' :
                          modelOption.provider === 'anthropic' ? 'bg-orange-500' :
                          modelOption.provider === 'google' ? 'bg-blue-500' :
                          'bg-zinc-500'
                        }`}></div>
                        {modelOption.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                    title="Add attachment"
                    data-testid="button-attachment"
                  >
                    <img 
                      src={theme === 'dark' ? attachmentDark : attachmentLight} 
                      alt="Attachment" 
                      className="w-5 h-5 brightness-200 contrast-150"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-[#303030] !bg-white dark:!bg-[#303030] border-none text-black dark:text-white rounded-xl shadow-2xl p-1 min-w-[160px]">
                  <DropdownMenuItem 
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span>Upload File</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer rounded-lg focus:bg-black/10 dark:focus:bg-white/10 focus:text-black dark:focus:text-white"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Image className="w-4 h-4 text-zinc-400" />
                    <span>Upload Image</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className={`w-9 h-9 ${isListening ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'} rounded-full transition-all`}
                onClick={toggleListening}
                disabled={!speechSupported}
                title="Voice input"
                data-testid="button-mic"
              >
                <img 
                  src={theme === 'dark' ? micDark : micLight} 
                  alt="Mic" 
                  className="w-5 h-5 brightness-200 contrast-150"
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                onClick={handleEnhancePrompt}
                disabled={!inputValue.trim() || isEnhancing}
                title="Enhance prompt"
                data-testid="button-enhance"
              >
                {isEnhancing ? (
                  <div className="animate-spin w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full"></div>
                ) : (
                  <img 
                    src={theme === 'dark' ? enhancePromptDark : enhancePromptLight} 
                    alt="Enhance" 
                    className="w-5 h-5 brightness-200 contrast-150"
                  />
                )}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() && !attachedImage}
                className="w-10 h-10 bg-white hover:bg-zinc-200 text-black rounded-full flex items-center justify-center transition-all disabled:opacity-30 ml-0.5"
                data-testid="button-send-message"
              >
                <ArrowUp className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {/* Voice Listening Indicator Overlay moved inside the relative container */}
          {isListening && (
            <div className="absolute inset-x-0 -top-8 flex justify-center">
              <div className="bg-emerald-500/10 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20 flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Listening...</span>
              </div>
            </div>
          )}
        </div>
      </div>
      


      {/* Attachment Dialog */}
      <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Attachment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => fileInputRef.current?.click()}
              data-testid="attachment-upload-file"
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Upload File</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => imageInputRef.current?.click()}
              data-testid="attachment-upload-image"
            >
              <Image className="h-6 w-6" />
              <span className="text-sm">Upload Image</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customize Modal */}
      <CustomizeModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        currentPreset={currentPreset}
        customInstructions={customInstructions}
        onSave={handleCustomizeSave}
        toggles={settingsToggles}
        aiOrder={aiOrder}
        user={user}
        profilePicture={profilePicture || undefined}
        onUserRename={(newName) => setUser(prev => prev ? { ...prev, username: newName, displayName: newName } : prev)}
        onProfilePictureChange={(dataUrl) => { setProfilePicture(dataUrl); localStorage.setItem('profilePicture', dataUrl); }}
      />

      {/* Image Generation Dialog */}
      <ImageGenerationDialog
        open={isImageGenerationDialogOpen}
        onOpenChange={setIsImageGenerationDialogOpen}
      />

      {/* Education Modal */}
      <EducationModal
        isOpen={isEducationModalOpen}
        onClose={() => setIsEducationModalOpen(false)}
        onStartExamination={handleStartExamination}
        onStartSelfListen={handleStartSelfListen}
      />

      {/* Voice Mode Modal */}
      <VoiceModeModal
        isOpen={isVoiceModeModalOpen}
        onClose={() => setIsVoiceModeModalOpen(false)}
        isListening={isListening}
        onToggleListening={toggleListening}
        isPlaying={false}
        onTogglePlaying={() => {}}
      />

      {/* Lumin Notification - Show in both tabs */}
      {showLuminNotification && (
        <LuminNotification onClose={() => setShowLuminNotification(false)} />
      )}
    </div>
  );
}
