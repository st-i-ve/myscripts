// Configuration module for Sequential Section Navigator
window.SSNConfig = {
  // sorting configuration from SortpileIndicator_IBM.js
  sortingConfig: {
    // Environmental Initiative (LEFT - Green)
    "A fishing fleet wants to develop nets that will capture and kill fewer dolphins": "left",
    "A company switches its delivery fleet to electric vehicles": "left",
    "A farm reduces chemical pesticide use": "left",

    // Governance Standard (RIGHT - Blue)
    "An online retailer wants to keep fraudulent merchandise off its website": "right",
    "A business adopts transparent auditing procedures": "right",
    "A company enforces anti-bribery compliance": "right",

    // Social Relationship (CENTER - Yellow)
    "A restaurant chain wants to provide surplus food supplies to homeless shelters": "center",
    "A tech company promotes inclusivity in its hiring": "center",
    "Employees start a volunteer mentoring group": "center",

    // Mindset examples
    "I'll never get this right": "left",
    "I'm a failure": "left",
    "I don't deserve success": "left",
    "I always get this wrong": "left",
    "I'll never be able to do this": "left",
    "I'm not good enough": "left",
    "I'm always wrong": "left",
    "I don't deserve something": "left",

    "I find this hard": "right",
    "I am frequently getting this wrong": "right",
    "I'm struggling": "right",
    "This is taking me a long time to do": "right",

    // Listening skills
    "Having an open, neutral stance": "left",
    "Nodding your head": "left",
    "Leaning forward": "left",
    "Holding or glancing at your phone": "right",
    "Crossing your arms": "right",
    "Leaning away": "right",

    // Environmental Initiative (LEFT)
    "Traffic congestion": "right",
    "Pollution": "left",
    "Bird migration": "left",
    "Rain and flood": "left",
    "Hunting license": "right",
    "Insect crop damage": "left",

    // Social Relationship (CENTER)
    "Skills training": "center",
    "Child adoption": "center",
    "Education": "center",
    "Substance abuse": "center",

    // Governance Standard (RIGHT)
    "Antibiotic approval": "right",
    "Poison control": "right",

    // Sustainable behaviors
    "Walk or bicycle rather than drive.": "right",
    "Bring reusable bags into stores.": "left",
    "Take public transportation when possible.": "right",
    "Buy only enough food to meet your needs.": "left",
    "Avoid single-use water bottles and straws.": "left",
    "Drive energy-efficient vehicles.": "right",
    "Share rides, car-pool, and use public transportation.": "right",
    "Buy energy-efficient electrical appliances.": "left",
  },

  // Selector configurations
  selectors: {
    process: [
      "button.process-arrow.process-arrow--right.process-arrow--scrolling",
      "button[data-testid='arrow-next'][data-arrow='next']",
      "button.process-arrow[aria-label='Next']",
      "button.process-arrow",
    ],
    
    scenario: [
      "button.scenario-block__text__continue",
      "button.scenario-block__dialogue__button.scenario-block__dialogue__button--appear-done.scenario-block__dialogue__button--enter-done",
    ],
    
    nextButton: [
      'button[data-testid="arrow-next"]',
      'button.next-btn',
      'button[aria-label*="next"]',
      'button[aria-label*="Next"]',
      'button.continue-btn',
      'button[class*="next"]'
    ],
    
    nextButtonExcludeProcess: [
      'button[data-testid="arrow-next"]:not(.process-arrow)',
      "button.next-btn",
      'button[aria-label*="next"]:not(.process-arrow)',
      'button[aria-label*="Next"]:not(.process-arrow)',
      "button.continue-btn",
      'button[class*="next"]:not(.process-arrow)',
    ]
  },

  // Timing configurations
  timing: {
    scrollWait: 300,
    clickInterval: 200,
    nextButtonCheck: 500,
    maxClicks: 300,
    maxWaitTime: 60000
  },

  // Interactive block types
  interactiveTypes: [
    "sorting activity - manual sorting",
    "process - auto click with next wait",
    "scenario - auto continue with next wait",
    "flashcards - flip cards",
    "accordion - open all accordions", 
    "labeled graphic - open labels",
    "continue button - click",
    "knowledge - answer with radio",
    "knowledge - answer with checkbox",
    "knowledge - general"
  ]
};