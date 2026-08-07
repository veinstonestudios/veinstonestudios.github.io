/* ============================================================================
   THE FACILITY — PRESS KIT CONTENT

   This is the only file you need to edit. It is plain text between quotes.

   RULES
     1. Keep the quotes ' ' around text.
     2. Keep the comma at the end of each line.
     3. If your text contains an apostrophe, write \' instead of '
        e.g.  'the State\'s workforce'
     4. Anything left as ''  simply disappears from the page.
     5. Lines starting with //  are switched off. Delete the // to turn on.
     6. For MORE THAN ONE PARAGRAPH, use square brackets and separate each
        paragraph with a comma:
              body: ['First paragraph.', 'Second paragraph.']
        Never put loose text on its own line — that is a syntax error and
        blanks the whole page.

   After editing, save and refresh the page. If something looks broken,
   you almost certainly missed a quote or a comma on the line you changed.
   ========================================================================== */

window.PRESSKIT = {

  /* ---------------------------------------------------------------- HEADER */
  hero: {
    // Big title. Each entry is its own line on screen.
    titleLines:   ['The', 'Facility'],
    hook:         'Trust no one. Anomalies are hiding among your inmates.',
    tagline:      'Psychological Horror',

    // Background loop behind the header: new gf (1).webm … new gf (4).webm
    bgVideo:      'new gf (4).webm',

    // Paste ONLY the YouTube video id, not the whole address.
    // From  youtube.com/watch?v=AbCdEf12345  the id is  AbCdEf12345
    // Leave '' until the teaser is uploaded.
    youtubeId:    'GxnOLUJAAvo',

    steamUrl:     'https://store.steampowered.com/app/3796790/The_Facility/',
    assetKitUrl:  'https://drive.google.com/drive/folders/1yGicMxLobo0BcA_uS1AugO7LgC0MpXe3?usp=sharing',
    pressEmail:   'veinstonestudios@gmail.com'
  },

  /* ------------------------------------------------------------ FACT SHEET */
  // Add a row: copy a line, change the two pieces of text.
  // Remove a row: delete its line.
  facts: [
    { label: 'Title',         value: 'The Facility' },
    { label: 'Developer',     value: 'Veinstone Studios' },
    { label: 'Genre',         value: 'Psychological Horror / Management Sim' },
    { label: 'Platform',      value: 'PC — Steam' },
    { label: 'Players',       value: 'Singleplayer' },
    { label: 'Release date',  value: 'Q4 2026' },
    { label: 'Runtime',       value: 'TBA' }          // ← fill this in
  //{ label: 'Engine',        value: 'Unity' },       // ← delete the // to show
  //{ label: 'Based in',      value: 'Ankara, Turkey' },
  ],

  languages: [
    'English', 'Turkish', 'French', 'Italian', 'German',
    'Spanish'
  ],

  /* --------------------------------------------------------------- GALLERY */
  galleryHead: {
    eyebrow:     'Gallery',
    heading:     'Screenshots & Clips',
    description: 'Check out asset kit for high-res images, video clips, and logos.'
  },

  /* Add a photo: copy one line, change the file name and the caption.
     The three sliding strips fill themselves from this list, in order.
     Spaces and odd characters in file names are handled for you.
     GIFs work exactly the same as photos.                                   */
  gallery: [
    { src: 'Photos/NewScreenshots/CellInspection.jpg', caption: 'Cell inspection',
      alt: 'Inspecting an inmate through the cell hatch' },
    { src: 'Photos/NewScreenshots/JournalSystem.jpg',  caption: 'The journal',
      alt: 'The journal used to cross-reference testimony' },
    { src: 'Photos/NewScreenshots/NpcSelection.jpg',   caption: 'Selection',
      alt: 'Choosing which inmates to deploy' },
    { src: 'Photos/NewScreenshots/TapeRecorder.jpg',   caption: 'Tape recorder',
      alt: 'Reviewing a recorded interrogation' },
    { src: 'Photos/NewScreenshots/Waking Up !.jpg',    caption: 'Morning shift',
      alt: 'Waking up at the start of a shift' },

    // These four still need real captions - replace the TODO text.
    { src: 'newgfff (1).jpg',                          caption: 'TODO — caption' },
    { src: 'newgfff (2).jpg',                          caption: 'TODO — caption' },
    { src: 'Photos/NewScreenshots/Jhnkajbnuin.jpg',    caption: 'TODO — caption' },
    { src: 'Photos/NewScreenshots/RHAndas dasd.jpg',   caption: 'TODO — caption' },
    { src: 'Photos/NewScreenshots/igonmq;x.jpg',       caption: 'TODO — caption' },

    { src: 'new gf (1).gif',                           caption: 'TODO — caption' },
    { src: 'new gf (2).gif',                           caption: 'TODO — caption' }

    /* More shots are sitting in Photos/GameScreenShots/ but they are 3–5 MB
       PNGs each. Save them as JPG (quality ~85) first, then switch them on:
    ,{ src: 'Photos/GameScreenShots/HallSc.jpg',       caption: 'The hall' }
    ,{ src: 'Photos/GameScreenShots/CellJulia.jpg',    caption: 'Julia\'s cell' }
    ,{ src: 'Photos/GameScreenShots/Picnic.jpg',       caption: 'Picnic' }
    ,{ src: 'Photos/GameScreenShots/SelectInmatesSC.jpg', caption: 'Selecting inmates' }
    */
  ],

  /* ----------------------------------------------------------------- ABOUT */
  about: {
    eyebrow: 'About',
    heading: 'What it is',
    paragraphs: [
      'The Facility is a psychological horror strategy game with a retro PSX aesthetic. Set in a world on the brink of collapse, you play as the newly appointed warden of Facility 61. Your job is to manage a rehabilitation center for subjects required by the State for dangerous reconstruction missions.',
      'However, not everyone in your custody is human. Hidden among the inmates are Anomalies — mimics capable of disguising themselves as humans. Your survival depends on your ability to identify and contain these threats before they infiltrate the State\'s workforce.'
    ]
  },

  /* The three copy-to-clipboard descriptions.
     'long' is left empty on purpose - it reuses the About paragraphs above. */
  descriptions: {
    one:   '',   // ← still missing. One sentence, under 15 words, name the genre.
    short: 'Trust no one. In this PSX-inspired horror game, anomalies are hiding among your inmates. It is your job to expose them before you accidentally deploy them into the world. Can you tell the difference between a human and an anomaly?',
    long:  ''
  },

  /* ----------------------------------------------------------- HOW TO PLAY */
  play: {
    eyebrow: 'How to play',
    heading: 'One day, four decisions',
    // Add a step: copy one block.
    phases: [
      { title: 'Orders',        body: 'The State faxes your quota at dawn. Read it carefully — how many bodies, and for what work.' },
      { title: 'Interrogation', body: 'Question inmates face to face. Inspect their documents for discrepancies. Watch for what doesn\'t sit right.' },
      { title: 'Selection',     body: 'Decide who ships out. Sending a human to a death trap wastes a resource. Sending an Anomaly is worse.' },
      { title: 'Night',         body: 'What you decided comes back. Scripted night events follow your choices. Survive until morning.' }
    ],
    detail: {
      heading: 'Anomaly detection',
      paragraphs: [
        'Investigate inmate files, cross-reference their stories, and look for visual distortions. If you fail to identify an Anomaly and send them on an assignment, the State holds you responsible for the consequences.'
      ],
      aside: 'Paranoia is your only friend.',
      image: 'Photos/NewScreenshots/CellInspection.jpg',
      imageAlt: 'Inspecting an inmate through the cell hatch'
    }
  },

  /* --------------------------------------------------------- FOR CREATORS */
  notices: {
    eyebrow: 'For creators',
    heading: 'Before you record',
    /* Add a card: copy one block. Set warn:true for the red left edge.

       'body' can be ONE line ......  body: 'A single sentence.'
       or SEVERAL paragraphs ......  body: ['First para.', 'Second para.']
       'list' adds bullet points under the body. Both are optional.          */
    items: [
      { title: 'Audio safety',
        body:  'All audio in The Facility is original and stream safe. No DMCA concerns.' },

      { title: 'Content warnings',
        body:  'The Facility is a psychological horror game that includes:',
        list: [
          'Frequent violence or gore — blood and dead bodies in a retro PS1 art style.',
          'General mature content — disturbing sounds, flashing lights, and creature designs intended to frighten the player.',
          'A threatening environment where the player is in danger from hostile entities.'
        ],
        warn:  true }
    //,{ title: 'Embargo', body: 'No embargo. Post any time, including the ending.' }
    ]
  },

  /* ---------------------------------------------------------------- STUDIO */
  studio: {
    eyebrow: 'Studio',
    heading: 'Veinstone Studios',
    logo:    'Logowithbackground.png',
    blurb:   'An indie team in Ankara, Turkey, currently building <em>The Facility</em>.',
    crew: [
      { role: '3D Artist', name: 'Naz Sökmen' },
      { role: 'Developer', name: 'Huzeyfe Celep' },
      { role: '2D Artist', name: 'Selin Pektaş' },
      { role: 'Marketing', name: 'Mustafa Kaan Güngör'}
    ],
    links: [
      { label: 'YouTube',    url: 'https://www.youtube.com/@RealVeinstoneStudios' },
      { label: 'Instagram',  url: 'https://www.instagram.com/veinstonestudios' },
      { label: 'TikTok',     url: 'https://www.tiktok.com/@veinstonestudios' },
      { label: 'Studio site', url: 'index.html' }
    ]
  },

  footer: {
    left:  '© 2026 Veinstone Studios',
    right: 'The Facility'
  }
};
