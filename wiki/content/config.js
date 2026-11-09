/* ============================================================================
   THE FACILITY WIKI — SITE CONFIGURATION

   This file controls:
     1. Which article files exist           (articles)
     2. The left navigation sidebar          (sidebar)
     3. What appears on the Main Page        (mainPage)

   Article text itself lives in  wiki/content/articles/*.md
   See wiki/README.md for the full editing guide.
   ========================================================================== */

window.WIKI_CONFIG = {

  siteName:  'The Facility Wiki',
  gameTitle: 'The Facility',

  /* Bump this number after editing articles so browsers fetch fresh copies. */
  version: '2026-11-09.1',

  /* External links shown in the header and footer. */
  links: {
    studio:   '../',
    presskit: '../presskit.html',
    steam:    'https://store.steampowered.com/app/3796790/The_Facility/'
  },

  /* --------------------------------------------------------------------------
     ARTICLES
     One entry per file in content/articles/ (file name without ".md").
     A new article will not appear anywhere until it is listed here.
     ------------------------------------------------------------------------ */
  articles: [
    // Main
    'the-facility',
    'the-world',
    'timeline',

    // Characters
    'henry-edaven',
    'arthur-edaven',
    'viktor-hale',
    'vera-collins',
    'ted-karinsky',
    'm-cole-morgan',
    'alicia-winston',
    'bob',

    // Locations
    'facility-61',
    'facility-60',

    // Lore
    'the-analog-era',
    'the-technology-purge',
    'the-corrupted',
    'core-program',
    'remnants',

    // Game information
    'gameplay',
    'assignments',
    'tests-and-detection-methods',
    'night-events',
    'endings',

    // Category pages (introductions shown at the top of each category)
    'category-characters',
    'category-facility-staff',
    'category-inmates',
    'category-other-characters',
    'category-locations',
    'category-other-locations',
    'category-lore',
    'category-game-information',
    'category-the-world',

    // Wiki project pages
    'wiki-about'
  ],

  /* --------------------------------------------------------------------------
     SIDEBAR
     [ 'Text shown', 'Page title it links to' ]
     ------------------------------------------------------------------------ */
  sidebar: [
    { heading: 'Main', links: [
      ['Main Page',  'Main Page'],
      ['The Facility', 'The Facility'],
      ['The World',  'The World'],
      ['Timeline',   'Timeline']
    ]},
    { heading: 'Characters', links: [
      ['All Characters',   'Category:Characters'],
      ['Facility Staff',   'Category:Facility Staff'],
      ['Inmates',          'Category:Inmates'],
      ['Other Characters', 'Category:Other Characters']
    ]},
    { heading: 'Locations', links: [
      ['Facility 61',     'Facility 61'],
      ['Facility 60',     'Facility 60'],
      ['Other Locations', 'Category:Other Locations']
    ]},
    { heading: 'Lore', links: [
      ['The Analog Era',       'The Analog Era'],
      ['The Technology Purge', 'The Technology Purge'],
      ['The Corrupted',        'The Corrupted'],
      ['CORE Program',         'CORE Program'],
      ['Remnants',             'Remnants']
    ]},
    { heading: 'Game Information', links: [
      ['Gameplay',                    'Gameplay'],
      ['Assignments',                 'Assignments'],
      ['Tests & Detection Methods',   'Tests & Detection Methods'],
      ['Night Events',                'Night Events'],
      ['Endings',                     'Endings']
    ]},
    { heading: 'Wiki Tools', links: [
      ['Random page',     'Special:Random'],
      ['All pages',       'Special:AllPages'],
      ['Recent changes',  'Special:RecentChanges'],
      ['All categories',  'Special:Categories'],
      ['About this wiki', 'The Facility Wiki:About']
    ]}
  ],

  /* --------------------------------------------------------------------------
     MAIN PAGE
     ------------------------------------------------------------------------ */
  mainPage: {
    intro: [
      '**[[The Facility]]** is a psychological horror game by Veinstone Studios, set in the year 2055. ' +
      'The player takes the role of [[Henry Edaven]], the Warden of [[Facility 61]] — a prison and rehabilitation ' +
      'center holding individuals suspected of being [[The Corrupted|Corrupted]].',
      'This wiki is a community encyclopedia documenting the characters, locations and lore of the game. ' +
      'Information that has not been confirmed is clearly marked as unknown.'
    ],
    featuredArticle: 'Facility 61',
    featuredCharacters: ['Henry Edaven', 'Arthur Edaven', 'Ted Karinsky', 'M. Cole Morgan', 'Alicia Winston', 'Bob'],
    importantLocations: ['Facility 61', 'Facility 60'],
    lore: ['The Analog Era', 'The Technology Purge', 'The Corrupted', 'CORE Program', 'The World', 'Timeline'],
    shortcuts: [
      ['Characters',       'Category:Characters'],
      ['Locations',        'Category:Locations'],
      ['Lore',             'Category:Lore'],
      ['Game Information', 'Category:Game Information'],
      ['Timeline',         'Timeline'],
      ['The World',        'The World']
    ]
  }
};
