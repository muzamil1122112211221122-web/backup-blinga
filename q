    "Here's what I can help you with:",
    "Some ideas to get you started:",
    "What's on your mind?",
    "Got something in mind? Try one of these:",
    "Where would you like to begin?",
    "Let's dive in — pick a starter:",
    "Curious about something? Start here:",
  ];
  const [starterHeading] = useState(() => starterHeadings[Math.floor(Math.random() * starterHeadings.length)]);
  const changeTab = (tab: 'ask' | 'nomad' | 'philosopher' | 'fius-games' | 'imagine') => {
    if (isFreePlanExhausted && tab !== activeTab) {
      showUpgradeLockToast();
      return;
    }
    if (isFreePlan && (tab === 'nomad' || tab === 'imagine')) {
      toast({
        title: "Locked on Free plan",
        description: tab === 'nomad'
          ? "Nomad (multi-AI compare) requires Fius Ultimate."
          : "Imagine Studio requires Fius Ultimate.",
        variant: "destructive",
      });
      return;
    }
    // Save current model for the tab we're leaving (not imagine — that always resets)
    if (activeTab !== 'imagine') {
      localStorage.setItem(`tabModel_${activeTab}`, selectedModel);
    }
    setActiveTab(tab);
    if (tab === 'imagine') {
      setSelectedModel('fius-imagine-fast' as AvailableModel);
