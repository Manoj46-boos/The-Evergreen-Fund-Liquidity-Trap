/**
 * THE SCRIPT — "The Evergreen Fund Liquidity Trap: What 'Semi-Liquid' Really
 * Means". The complete documentary script (evergreen_fund_script.docx),
 * structured as chapters → beats. Every beat carries the exact voiceover
 * text plus the on-screen scene direction.
 *
 * VAULT NOIR v3 scene language: statReveal (the 5% cold open),
 * wrapperMatrix (the four legal wrappers), flowLiquidity (the cash
 * plumbing), prorationDemo (requested ≠ fulfilled), caseFiles (Cliffwater /
 * BCRED / OBDC II), navGap (NAV 100 vs economic 90), feeStack (the BCRED
 * fee layers), bullCase, auditChecklist (the eight questions), systemMap
 * (liquidity as a system) — plus the inherited host / bigText / stampCard /
 * quoteCard / splitNumbers / statCards / barsCompare / takeaways /
 * commentPrompt / endScreen drawers.
 */

export interface BeatSpec {
  /** Voiceover text (verbatim from the documentary script) */
  vo: string;
  /** ms of silence after this beat */
  pauseAfter?: number;
  /** scene props; `sceneKey` groups consecutive beats into one continuous scene */
  scene: { type: string; sceneKey: string; [k: string]: unknown };
  /** per-beat vocal direction. Maps to TTS rate/pitch offsets so a
   *  22-minute narration stops being one flat read. */
  voStyle?: 'calm' | 'neutral' | 'urgent' | 'reveal' | 'quote';
  /** a different Edge voice for this beat (quoted characters) */
  voice?: string;
  /** duck the BGM to near-silence just before this beat's payoff line */
  dropOut?: boolean;
}

export interface ChapterSpec {
  id: string;
  title: string;
  beats: BeatSpec[];
}

const P = (type: string, sceneKey: string, props: Record<string, unknown> = {}) => ({
  type,
  sceneKey,
  ...props,
});

export const SCRIPT: ChapterSpec[] = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'ch1',
    title: 'The number that changes the question',
    beats: [
      {
        // the cold open — the 5% glyph assembles while the first line plays
        vo:
          'Suppose you own a million dollars in a semi-liquid fund. You want all of it back.',
        pauseAfter: 700,
        voStyle: 'urgent',
        scene: P('statReveal', 'c1-open', { opening: true, mode: 'setup' }),
      },
      {
        vo:
          "The fund offers quarterly liquidity at five percent. So you might assume that, in a reasonably orderly market, you can work your way out over time.",
        pauseAfter: 650,
        scene: P('statReveal', 'c1-open', { mode: 'offer' }),
      },
      {
        vo:
          'But that five percent is not a personal withdrawal allowance. It is a limit on the fund.',
        pauseAfter: 650,
        voStyle: 'reveal',
        dropOut: true,
        scene: P('statReveal', 'c1-open', { mode: 'limit' }),
      },
      {
        vo:
          'If everyone asks to leave, and the fund can repurchase only five percent of its shares, you may receive only five percent of your position — not one hundred percent of it. Your million-dollar exit becomes a fifty-thousand-dollar exit, before any change in value or applicable fees.',
        pauseAfter: 800,
        voStyle: 'reveal',
        scene: P('statReveal', 'c1-open', { mode: 'prorate' }),
      },
      {
        vo: 'That is the distinction this video is about.',
        pauseAfter: 600,
        voStyle: 'reveal',
        scene: P('bigText', 'c1-question', { lines: ['That is the distinction', 'this video is about.'] }),
      },
      {
        vo:
          'Not whether an evergreen fund has an exit button. It does. The question is whether that button works at the size you need, at the time you need it, and at a price that reflects economic reality.',
        pauseAfter: 700,
        scene: P('bigText', 'c1-question', {
          lines: ['The exit button works —', 'at the size you need?'],
          sub: 'size · timing · price',
        }),
      },
      {
        vo:
          'Because "semi-liquid" does not mean half as liquid as cash. It means access to private assets through a redemption system whose capacity can become the binding constraint.',
        pauseAfter: 650,
        scene: P('host', 'c1-semi', {
          stage: 'spot',
          gesture: 'present',
          expression: 'serious',
          entrance: 'walk',
          walkAcross: true,
          headline: '"Semi-liquid" is not\n"half as liquid as cash".',
          sub: 'Access to private assets through a redemption system — whose capacity can become the binding constraint.',
          kicker: 'THE EVERGREEN FUND · LIQUIDITY TRAP',
        }),
      },
      {
        vo:
          'By the end, you will be able to separate four different legal structures, understand what happened when redemption demand rose in 2026, and apply a due-diligence framework that goes beyond the headline yield.',
        pauseAfter: 700,
        scene: P('host', 'c1-semi', {
          gesture: 'count3',
          headline: 'Four structures.\nThree 2026 cases.\nOne audit.',
          sub: 'The due-diligence framework beyond the headline yield.',
        }),
      },
      {
        // the thesis — WRAPPER / PORTFOLIO / BEHAVIOUR
        vo:
          'The central thesis is simple: liquidity is not just a feature of the asset. It is a feature of the wrapper, the portfolio, and the behaviour of everyone else invested beside you.',
        pauseAfter: 800,
        voStyle: 'reveal',
        scene: P('trioConverge', 'c1-thesis', {
          items: [
            { big: 'WRAPPER', label: 'the legal redemption promise', tone: 'gold' },
            { big: 'PORTFOLIO', label: 'what the assets can actually convert to', tone: 'up' },
            { big: 'BEHAVIOUR', label: 'what everyone beside you does', tone: 'down' },
          ],
          title: 'Liquidity is a feature of three things',
          cornerNote: 'the thesis of this film — every chapter maps onto it',
        }),
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'ch2',
    title: 'A structural shift, not a product fad',
    beats: [
      {
        vo: "Let's establish the scale without mixing incompatible numbers.",
        pauseAfter: 500,
        voStyle: 'calm',
        scene: P('host', 'c2-scale', {
          stage: 'spot',
          gesture: 'present',
          entrance: 'walk',
          walkAcross: true,
          headline: 'The scale —\nwithout mixing datasets.',
          sub: 'Launch counts and net assets are different datasets. Same direction, different universes.',
          kicker: 'THE STRUCTURAL SHIFT',
        }),
      },
      {
        vo:
          'Preqin counted a record 123 evergreen private-capital fund launches in 2025. From 2023 through 2025, it counted 337 launches — more than the 299 launched during the seven years from 2016 through 2022.',
        pauseAfter: 650,
        scene: P('barsCompare', 'c2-launches', {
          bars: [
            { label: '2016–2022', value: 299, tone: 'muted', note: 'seven years' },
            { label: '2023–2025', value: 337, tone: 'up', note: 'three years · record run' },
          ],
          title: 'Evergreen fund launches',
          source: 'Source: Preqin · evergreen private-capital funds · data as of February 2026',
          cornerNote: 'a launch count — not assets under management',
        }),
      },
      {
        // U7 re-stage: the launch-count verdict becomes a STAMP — a
        // character-led break in the barsCompare anchor run (D19).
        vo: 'That is a launch count. It is not assets under management.',
        pauseAfter: 600,
        voStyle: 'reveal',
        scene: P('stampCard', 'c2-launchcount', { stamp: 'A LAUNCH COUNT', sub: 'Not assets.', expression: 'serious' }),
      },
      {
        vo:
          'For assets, a Federal Reserve staff note published in October 2026 examined three US vehicles: interval funds, tender-offer funds, and non-traded perpetual-life business development companies. Their combined net assets rose from fifteen billion dollars in 2018 to 388 billion dollars in 2025.',
        pauseAfter: 650,
        scene: P('barsCompare', 'c2-assets', {
          bars: [
            { label: '2018', value: 15, tone: 'muted', note: '$15B combined net assets' },
            { label: '2025', value: 388, tone: 'up', note: '$388B combined net assets' },
          ],
          title: 'US semi-liquid vehicles: net assets',
          source: 'Source: Federal Reserve staff note (FEDS), October 2026 — interval, tender-offer funds + non-traded perpetual BDCs',
          cornerNote: 'different dataset, different universe — same direction',
        }),
      },
      {
        // U7 re-stage: the dataset verdict becomes a pull-quote — the
        // character owns the beat between the two bar charts (D19).
        vo: 'Different dataset. Different universe. Same direction.',
        pauseAfter: 550,
        voStyle: 'reveal',
        scene: P('quoteCard', 'c2-direction', {
          kicker: 'THE DISCIPLINE',
          lines: ['Different dataset. Different universe. Same direction.'],
          icon: 'asterisk',
        }),
      },
      {
        vo:
          "And demand is not simply a retail story. BBH's 2026 survey covered 500 institutional investors and wealth advisers across the United States, the United Kingdom, Japan, Germany and Switzerland. Eighty-four percent said they planned to increase private-market investments over the next two years. The survey also identified evergreen funds as a preferred structure and liquidity as a defining priority.",
        pauseAfter: 650,
        scene: P('statCards', 'c2-bbh', {
          cards: [
            { big: '500', label: 'institutional investors and advisers surveyed · US, UK, Japan, Germany, Switzerland', tag: 'five markets', tone: 'gold' },
            { big: '84%', label: 'plan to increase private-market investments over the next two years', tag: 'preferred structure: evergreen', tone: 'up' },
          ],
          source: 'Source: BBH 2026 institutional investor survey',
        }),
      },
      {
        vo:
          'But three out of four respondents said the time required to get capital returned had increased over the previous year.',
        pauseAfter: 650,
        voStyle: 'reveal',
        // U7 re-stage: the friction number lands on the HOST (the chapter's
        // walk-storytelling beat — he crosses to the number and presents it).
        scene: P('host', 'c2-friction', {
          gesture: 'count3',
          entrance: 'walk',
          walkAcross: true,
          headline: 'Three out of four\nsay it takes longer.',
          sub: 'The time required to get capital returned has increased — the friction is already measured. Source: BBH 2026 survey.',
        }),
      },
      {
        vo:
          'That is the commercial engine behind this market. Investors want the exposure. They also want their capital back sooner.',
        pauseAfter: 650,
        scene: P('splitNumbers', 'c2-engine', {
          mode: 'vs',
          stats: [
            { big: '84%', label: 'want more private-market exposure', tone: 'up' },
            { big: '75%', label: 'report slower capital returns', tone: 'down' },
          ],
          cornerNote: 'the commercial engine: both demands are real',
        }),
      },
      {
        vo:
          'The evergreen structure sits between those two demands. It does not abolish the conflict. It manages it.',
        pauseAfter: 700,
        scene: P('host', 'c2-engine', {
          gesture: 'present',
          headline: 'It does not abolish\nthe conflict.',
          sub: 'The evergreen structure manages it — through the redemption system.',
        }),
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'ch3',
    title: 'Four wrappers. Four different promises.',
    beats: [
      {
        vo: 'Now we need to remove the marketing umbrella.',
        pauseAfter: 500,
        scene: P('host', 'c3-umbrella', {
          stage: 'spot',
          gesture: 'present',
          entrance: 'walk',
          headline: 'Remove the\nmarketing umbrella.',
          sub: '"Evergreen" and "semi-liquid" are marketing labels. The legal obligation is underneath.',
          kicker: 'THE FOUR WRAPPERS',
        }),
      },
      {
        vo:
          '"Evergreen" describes an investment vehicle without a conventional fixed termination date. "Semi-liquid" describes a pattern of limited access. Neither label tells you the legal redemption obligation.',
        pauseAfter: 650,
        scene: P('bigText', 'c3-terms', {
          lines: ['Neither label tells you', 'the legal obligation.'],
          sub: '"evergreen" = no fixed termination · "semi-liquid" = limited access',
        }),
      },
      {
        vo:
          'And there is a terminology trap immediately. In US regulatory language, interval funds, tender-offer funds and non-traded perpetual-life BDCs are closed-end structures — even when the commercial discussion calls them open-ended or evergreen.',
        pauseAfter: 650,
        voStyle: 'reveal',
        scene: P('quoteCard', 'c3-trap', {
          kicker: 'THE TERMINOLOGY TRAP',
          lines: [
            'In US regulatory language, all three US vehicles are closed-end structures — even when the brochure says "evergreen".',
          ],
          icon: 'asterisk',
        }),
      },
      {
        vo:
          'So "closed-end" does not automatically mean a listed fund with a fixed life. And "evergreen" does not automatically mean an open-end mutual fund.',
        pauseAfter: 600,
        scene: P('quoteCard', 'c3-trap', {
          lines: ['"Closed-end" does not automatically mean a listed fund with a fixed life.'],
          icon: 'shield',
          soft: true,
        }),
      },
      {
        vo: "Let's separate the four structures that matter here.",
        pauseAfter: 550,
        scene: P('host', 'c3-four', {
          gesture: 'count3',
          headline: 'Four structures\nthat matter.',
          sub: 'Interval funds · tender-offer funds · non-traded BDCs · ELTIFs.',
        }),
      },
      {
        // U7 re-stage: the pro-rata rule lands on the HOST leaning into the
        // chapter's cinematic crossing (walkAcross) — the matrix anchor run
        // breaks and the rule gets a body (D19/D14).
        vo: 'If requests exceed the offer, repurchases are generally pro rata.',
        pauseAfter: 600,
        scene: P('host', 'c3-prorate', {
          gesture: 'pointR',
          entrance: 'walk',
          walkAcross: true,
          headline: 'Requests exceed\nthe offer — pro rata.',
          sub: 'Everyone is scaled down proportionally. Nobody is skipped.',
        }),
      },
      {
        // U7 (100-JUDGE VISUAL AUDIT — THE STRONG DRAWERS ROTATE INTO THE
        // SCRIPT): the 5-25% offer range lands on oddsSpread — the film's
        // range-on-a-track room draws the scheduled obligation's own
        // band instead of a fourth wrapper-matrix card.
        vo:
          'An interval fund makes repurchase offers on a pre-committed schedule, commonly quarterly. The offer is generally between five and twenty-five percent of outstanding shares. Many funds use five percent.',
        pauseAfter: 650,
        scene: P('oddsSpread', 'c3-offer-range', {
          title: 'The interval fund’s offer range',
          kicker: 'THE SCHEDULED OFFER',
          markers: [
            { at: 5, label: 'THE FLOOR — most funds set the quarterly offer here', tone: 'gold' },
            { at: 25, label: 'THE CEILING — the rule allows up to 25% of outstanding shares', tone: 'up' },
          ],
          closer: 'A scheduled obligation — the offer, not the request, is capped.',
          source: 'SEC Investor.gov — interval fund repurchase offers',
        }),
      },
      {
        vo:
          'That schedule is a fundamental policy. Changing it is not the same as a manager simply deciding to skip an inconvenient quarter. There are limited regulatory provisions for postponement, but the baseline is a scheduled obligation.',
        pauseAfter: 650,
        scene: P('wrapperMatrix', 'c3-interval', { focus: 0 }),
      },
      {
        // U7 re-stage: the pro-rata rule lands on the HOST leaning into the
        // chapter's cinematic crossing (walkAcross) — the matrix anchor run
        // breaks and the rule gets a body (D19/D14).
        vo: 'If requests exceed the offer, repurchases are generally pro rata.',
        pauseAfter: 600,
        scene: P('host', 'c3-prorate', {
          gesture: 'pointR',
          entrance: 'walk',
          walkAcross: true,
          headline: 'Requests exceed\nthe offer — pro rata.',
          sub: 'Everyone is scaled down proportionally. Nobody is skipped.',
        }),
      },
      {
        vo:
          'There is also an important liquidity safeguard: under the interval-fund rule, the fund must maintain highly liquid assets covering the repurchase offer from the notice date until the pricing date.',
        pauseAfter: 650,
        scene: P('wrapperMatrix', 'c3-interval', { focus: 0, highlight: 'safeguard' }),
      },
      {
        // U7 re-stage: the limit verdict becomes a pull-quote (character-led).
        vo:
          'That is stronger protection than a marketing promise. But it protects the offer — not an unlimited exit.',
        pauseAfter: 700,
        voStyle: 'reveal',
        scene: P('quoteCard', 'c3-limit', {
          lines: ['Stronger than a marketing promise — and it protects the offer, not an unlimited exit.'],
          icon: 'shield',
        }),
      },
      {
        // U7: the tender fund's board discretion lands on ownerWorker — the
        // two-shot with fired coins draws SCHEDULE vs DISCRETION as two
        // people on the film's shared terrain (the strongest staging the
        // engine owns for "two different decision-makers").
        vo:
          'A tender-offer fund is different. The board determines whether to make an offer, when to make it and how large it should be. A quarterly pattern may be the expectation. It is not the same legal commitment as an interval fund\u2019s schedule.',
        pauseAfter: 650,
        scene: P('ownerWorker', 'c3-tender-board', {
          left: { title: 'THE SCHEDULE', line: 'the interval fund\u2019s committed quarterly offer — a written obligation', tone: 'up' },
          right: { title: 'THE BOARD', line: 'the tender fund\u2019s discretion — whether, when, how large', tone: 'gold' },
        }),
      },
      {
        // U7 re-stage: the same-ad warning becomes a pull-quote.
        vo:
          'Two funds can advertise "quarterly liquidity" and still give you materially different rights.',
        pauseAfter: 600,
        scene: P('quoteCard', 'c3-samead', {
          lines: ['Two funds can advertise "quarterly liquidity" — and still give you materially different rights.'],
          icon: 'shield',
        }),
      },
      {
        vo:
          'The question is not just "How often?" It is "Who decides whether the window opens?"',
        pauseAfter: 700,
        voStyle: 'reveal',
        scene: P('wrapperMatrix', 'c3-tender', { focus: 1, highlight: 'who' }),
      },
      {
        vo:
          'A business development company is a separate legal structure designed primarily to invest in private or thinly traded operating companies. In this market, the relevant vehicles are usually non-traded, perpetual-life BDCs concentrated in private credit.',
        pauseAfter: 650,
        scene: P('wrapperMatrix', 'c3-bdc', { focus: 2 }),
      },
      {
        vo:
          'Many offer quarterly repurchases, often capped around five percent. But the board may be able to amend, suspend or otherwise modify the program under the fund\u2019s documents and applicable law.',
        pauseAfter: 650,
        scene: P('wrapperMatrix', 'c3-bdc', { focus: 2, highlight: 'board' }),
      },
      {
        // U7 re-stage: the listed-BDC warning becomes a STAMP (character-led).
        vo:
          'Do not confuse these with publicly traded BDCs. A listed BDC can be sold on an exchange, but at the market price — which may be below net asset value. That is immediate execution, not a promise of NAV.',
        pauseAfter: 650,
        scene: P('stampCard', 'c3-listed', {
          stamp: 'EXECUTION, NOT A PROMISE',
          sub: 'A listed BDC trades at the market price — which may be below NAV.',
        }),
      },
      {
        // U7 re-stage: the two-dimensions point becomes a stat pair.
        vo:
          'Also, a BDC using a tender-offer mechanism is still a BDC. The legal vehicle and the redemption mechanism are different dimensions.',
        pauseAfter: 650,
        scene: P('statCards', 'c3-dimensions', {
          cards: [
            { big: 'THE VEHICLE', label: 'the legal structure — here, a non-traded BDC', tag: 'what it is', tone: 'up' },
            { big: 'THE MECHANISM', label: 'the redemption design — tender offers in this case', tag: 'how it exits', tone: 'gold' },
          ]
        }),
      },
      {
        vo:
          'In Europe, the European Long-Term Investment Fund is a regulatory label, not a single liquidity design.',
        pauseAfter: 600,
        scene: P('wrapperMatrix', 'c3-eltif', { focus: 3 }),
      },
      {
        // U7 re-stage: the ELTIF 2.0 summary lands on the HOST.
        vo:
          'ELTIF 2.0 made semi-open-ended structures easier to use and removed the old ten-thousand-euro minimum for retail investors. But an ELTIF can still be closed-ended. If it offers early redemptions, its policy must be compatible with the portfolio\u2019s liquidity, long-term strategy and investor profile.',
        pauseAfter: 650,
        scene: P('host', 'c3-eltif-frame', {
          gesture: 'present',
          headline: 'Easier access.\nThe same hard questions.',
          sub: 'ELTIF 2.0 lowers the entry floor — the liquidity design still must fit the portfolio.',
        }),
      },
      {
        vo:
          'The final European technical standards give managers flexibility over notice periods, minimum holding periods and liquidity-management tools. There is no universal rule that every ELTIF must offer quarterly redemptions after twelve months\u2019 notice.',
        pauseAfter: 700,
        scene: P('wrapperMatrix', 'c3-eltif', { focus: 3, highlight: 'flex' }),
      },
      {
        // U7 re-stage: the chapter's verdict becomes a STAMP.
        vo: 'So before comparing yields, compare the contract.',
        pauseAfter: 650,
        voStyle: 'reveal',
        scene: P('stampCard', 'c3-contract', {
          stamp: 'COMPARE THE CONTRACT',
          sub: 'Before comparing yields.',
        }),
      },
      {
        vo:
          'Interval fund: a scheduled repurchase obligation, subject to its terms and limited exceptions. Tender-offer fund: board discretion. Non-traded BDC: a repurchase program governed by its own documents and board authority. ELTIF: a European framework whose actual liquidity terms must be read fund by fund.',
        pauseAfter: 750,
        scene: P('wrapperMatrix', 'c3-summary', { focus: -1, mode: 'summary' }),
      },
      {
        vo: 'Same shelf. Different plumbing.',
        pauseAfter: 700,
        voStyle: 'reveal',
        scene: P('stampCard', 'c3-plumbing', {
          stamp: 'SAME SHELF',
          sub: 'Different plumbing.',
          expression: 'serious',
        }),
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
const CH4: ChapterSpec = {
  id: 'ch4',
  title: 'When everyone asks to leave',
  beats: [
    {
      vo: "Now let's follow the cash.",
      pauseAfter: 500,
      scene: P('host', 'c4-cash', {
        stage: 'spot',
        gesture: 'present',
        entrance: 'walk',
        walkAcross: true,
        headline: 'Follow the cash.',
        sub: 'A redemption request above five percent does not automatically mean the fund is insolvent.',
        kicker: 'THE LIQUIDITY PLUMBING',
      }),
    },
    {
      vo:
        'A private-credit fund does not need to sell every loan to meet redemptions. It has several sources of liquidity: new subscriptions, interest and principal repayments, cash, liquid securities, and potentially borrowing capacity.',
      pauseAfter: 650,
      scene: P('flowLiquidity', 'c4-flow', { mode: 'sources' }),
    },
    {
      // U7 re-stage: the not-insolvent reassurance lands on the HOST.
      vo:
        'That is why a redemption request above five percent does not automatically mean the fund is insolvent.',
      pauseAfter: 600,
      scene: P('host', 'c4-frame', {
        gesture: 'present',
        headline: 'A big request\nis not insolvency.',
        sub: 'The fund has several sources of liquidity before it would need to sell anything.',
      }),
    },
    {
      vo: 'But each source has a condition.',
      pauseAfter: 550,
      voStyle: 'reveal',
      scene: P('flowLiquidity', 'c4-flow', { mode: 'conditions' }),
    },
    {
      vo:
        'New subscriptions depend on someone else wanting to enter. Loan repayments depend on borrowers refinancing or repaying — and that activity can slow when markets are stressed. Credit facilities have borrowing-base tests, covenants and available collateral. Asset sales depend on a buyer and a price.',
      pauseAfter: 700,
      scene: P('flowLiquidity', 'c4-flow', { mode: 'conditions', highlight: 'all' }),
    },
    {
      // U7 re-stage: the stress-test teaser becomes a STAMP.
      vo:
        'So the useful stress test is not "Does the fund have cash today?"',
      pauseAfter: 600,
      scene: P('stampCard', 'c4-test', {
        stamp: 'THE STRESS TEST',
        sub: 'Not "does the fund have cash today?"',
      }),
    },
    {
      vo:
        'It is: what happens if subscriptions fall, repayments slow, and redemption requests rise at the same time?',
      pauseAfter: 700,
      voStyle: 'reveal',
      dropOut: true,
      scene: P('flowLiquidity', 'c4-flow', { mode: 'stress' }),
    },
    {
      vo:
        'When requests exceed the available repurchase amount, the fund may prorate them. You ask for a hundred thousand dollars and receive fifty thousand. The remainder is still invested.',
      pauseAfter: 650,
      scene: P('prorationDemo', 'c4-prorate', { stage: 0 }),
    },
    {
      vo:
        'Whether you must submit that remainder again depends on the fund\u2019s procedures. Do not assume an automatic queue.',
      pauseAfter: 650,
      scene: P('prorationDemo', 'c4-prorate', { stage: 1 }),
    },
    {
      vo: 'This is where the word "gate" becomes imprecise.',
      pauseAfter: 600,
      scene: P('host', 'c4-gate', {
        gesture: 'present',
        headline: 'The word "gate"\nis imprecise.',
        sub: 'A cap being applied, an upsized offer and a suspension are three different events.',
      }),
    },
    {
      vo:
        'A pre-existing five-percent cap being applied is not necessarily a new emergency gate. An upsized offer is not necessarily unlimited liquidity. A suspension is a different event again.',
      pauseAfter: 700,
      scene: P('wrapperMatrix', 'c4-gate', { focus: -1, mode: 'gates' }),
    },
    {
      vo: 'And the gate has two sides.',
      pauseAfter: 550,
      scene: P('splitNumbers', 'c4-sides', {
        mode: 'vs',
        stats: [
          { big: 'PROTECTS', label: 'the portfolio from a fire sale into a weak market', tone: 'up' },
          { big: 'TRANSFERS', label: 'the liquidity risk to the investor who needs cash', tone: 'down' },
        ],
        cornerNote: 'the same mechanism — two consequences',
      }),
    },
    {
      vo:
        'It can prevent a manager from having to dump illiquid assets into a weak market, protecting remaining investors. But it also transfers liquidity risk to the investor who needs cash.',
      pauseAfter: 650,
      scene: P('quoteCard', 'c4-sides', {
        kicker: 'THE GATE\u2019S TWO SIDES',
        lines: [
          'Prudent portfolio management — and a serious personal liquidity problem — can be the same mechanism.',
        ],
        icon: 'shield',
      }),
    },
    {
      vo:
        'The same mechanism can be prudent portfolio management and a serious personal liquidity problem. That is not a contradiction. It is the trade.',
      pauseAfter: 800,
      voStyle: 'reveal',
      scene: P('bigText', 'c4-trade', { lines: ['Not a contradiction.', 'It is the trade.'] }),
    },
  ],
};

const CH5: ChapterSpec = {
  id: 'ch5',
  title: '2026: three cases, not one headline',
  beats: [
    {
      vo:
        'The 2026 redemption pressure gives us something better than a thought experiment. It gives us observed behaviour. But the cases were not identical.',
      pauseAfter: 650,
      scene: P('host', 'c5-open', {
        stage: 'spot',
        gesture: 'present',
        entrance: 'walk',
        headline: '2026: three cases,\nnot one headline.',
        sub: 'Observed behaviour — with dates and denominators on every number.',
        kicker: 'THE CASE FILES',
      }),
    },
    {
      vo:
        'Case one: Cliffwater. Reuters, citing a Bloomberg report and an investor letter, said investors in Cliffwater Corporate Lending Fund sought to redeem about fourteen percent of shares in the first quarter of 2026. The fund capped repurchases at seven percent.',
      pauseAfter: 650,
      scene: P('caseFiles', 'c5-cliffwater', { case: 0 }),
    },
    {
      // U7 re-stage: the framework-in-context read lands on the HOST (the
      // chapter's walk-storytelling beat).
      vo:
        'That is an interval fund operating within a disclosed repurchase framework — not evidence, by itself, that the portfolio had failed.',
      pauseAfter: 600,
      scene: P('host', 'c5-frame', {
        gesture: 'present',
        entrance: 'walk',
        walkAcross: true,
        headline: 'A framework operating\nas disclosed.',
        sub: 'Not evidence, by itself, that the portfolio had failed.',
      }),
    },
    {
      vo:
        'It is also a useful reminder to read the actual offer. The standard minimum was five percent; the reported repurchase amount was seven. A headline saying "five-percent gates across the industry" would miss that distinction.',
      pauseAfter: 700,
      scene: P('caseFiles', 'c5-cliffwater', { case: 0, highlight: 'read-offer' }),
    },
    {
      // U7 re-stage: case two OPENS on the HOST crossing to the dossier.
      vo:
        'Case two: BCRED. Blackstone Private Credit Fund tells a more complicated story.',
      pauseAfter: 600,
      scene: P('host', 'c5-bcred-open', {
        gesture: 'present',
        entrance: 'walk',
        walkAcross: true,
        headline: 'Case two: BCRED —\na more complicated story.',
        sub: 'Two quarters, two different answers — both true.',
      }),
    },
    {
      vo:
        'In a March 2026 SEC filing, BCRED said first-quarter requests exceeded its usual five-percent share repurchase amount. The board increased the offer to seven percent and fulfilled all requests. The fund also reported nearly two billion dollars of new subscriptions and approximately four hundred million dollars of investments from Blackstone and its employees.',
      pauseAfter: 650,
      scene: P('caseFiles', 'c5-bcred', { case: 1, quarter: 'Q1' }),
    },
    {
      // U7 re-stage: the Q2 reversal becomes a pull-quote (character-led).
      vo:
        'Then, in a June filing, BCRED said second-quarter requests were approximately ten percent of shares outstanding and that it would fulfil five percent. It reported inflows of approximately two percent of net asset value and a net outflow of approximately three percent.',
      pauseAfter: 650,
      scene: P('quoteCard', 'c5-q2', {
        kicker: 'THE ANSWER CHANGED WITH THE QUARTER',
        lines: [
          'Q1: every request met. Q2: five percent fulfilled against ten percent requested.',
        ],
        icon: 'asterisk',
        sub: 'Source: BCRED June 2026 filing',
      }),
    },
    {
      vo:
        'So which statement is true? "BCRED met every request" or "BCRED constrained exits"?',
      pauseAfter: 650,
      voStyle: 'reveal',
      scene: P('caseFiles', 'c5-bcred', { case: 1, quarter: 'both' }),
    },
    {
      // U7 re-stage: the paradox verdict becomes a STAMP — and the reaction
      // close-up (keyed c5-both) fires ON the stamp host (D23).
      vo: 'Both — at different dates.',
      pauseAfter: 650,
      voStyle: 'reveal',
      dropOut: true,
      scene: P('stampCard', 'c5-both', {
        stamp: 'BOTH TRUE',
        sub: 'At different dates.',
        kicker: 'SO WHICH STATEMENT IS TRUE?',
      }),
    },
    {
      vo:
        'That is why a single headline is an inadequate liquidity analysis. You need the quarter, the denominator, the board\u2019s decision and the resulting fulfilment rate.',
      pauseAfter: 650,
      scene: P('caseFiles', 'c5-bcred', { case: 1, quarter: 'both', highlight: 'denominator' }),
    },
    {
      // U7 re-stage: the liquidity caveat becomes a STAMP.
      vo:
        'BCRED also reported more than fifteen billion dollars of available liquidity in June, including undrawn borrowing capacity. That is relevant. But available liquidity is not the same thing as an unconditional right for every investor to exit at once.',
      pauseAfter: 700,
      scene: P('stampCard', 'c5-liquidity', {
        stamp: 'AVAILABLE \u2260 UNCONDITIONAL',
        sub: '$15B+ of liquidity is not an exit right for everyone at once.',
      }),
    },
    {
      // U7 re-stage: case three opens on a pull-quote (character-led).
      vo:
        'Case three: Blue Owl OBDC II. Blue Owl Capital Corporation II shows a different resolution.',
      pauseAfter: 600,
      scene: P('quoteCard', 'c5-obdc-open', {
        kicker: 'CASE THREE',
        lines: [
          'Blue Owl OBDC II shows a different resolution — a sale, a distribution, and a changed exit mechanism.',
        ],
        icon: 'asterisk',
      }),
    },
    {
      vo:
        'In February 2026, three Blue Owl BDCs announced agreements to sell a combined 1.4 billion dollars of direct-lending investments. Six hundred million dollars came from OBDC II.',
      pauseAfter: 650,
      scene: P('caseFiles', 'c5-obdc', { case: 2, quarter: 'r0' }),
    },
    {
      vo:
        'The assets were sold at fair value, equivalent to 99.7 percent of par. That is not evidence of a distressed sale at a deep discount. The price was close to par and consistent with the carrying value.',
      pauseAfter: 650,
      scene: P('caseFiles', 'c5-obdc', { case: 2, quarter: 'r1', highlight: 'par' }),
    },
    {
      vo:
        'OBDC II planned a return-of-capital distribution of up to approximately thirty percent of its year-end net asset value, alongside debt reduction. It also intended to replace future quarterly tender offers with quarterly return-of-capital distributions, paid ratably to shareholders.',
      pauseAfter: 650,
      scene: P('caseFiles', 'c5-obdc', { case: 2, quarter: 'r2', highlight: 'roc' }),
    },
    {
      vo:
        'Reuters described the change as permanently halting the fund\u2019s previous redemption mechanism.',
      pauseAfter: 650,
      scene: P('caseFiles', 'c5-obdc', { case: 2, quarter: 'r2', highlight: 'halt' }),
    },
    {
      vo:
        'This is the nuance a polarized narrative misses. The old exit mechanism changed. But investors were also offered a substantial capital return. A larger distribution is not the same as restoring the old redemption right.',
      pauseAfter: 700,
      scene: P('quoteCard', 'c5-nuance', {
        kicker: 'THE NUANCE THE HEADLINE MISSES',
        lines: [
          'The old exit mechanism changed — and investors received a substantial capital return. A larger distribution is not the same as restoring the old redemption right.',
        ],
        icon: 'asterisk',
      }),
    },
    {
      vo:
        'The right conclusion is neither "nothing happened" nor "the loans collapsed." It is that the liquidity contract changed, and the economic outcome depended on the assets, the transaction price and the timing of distributions.',
      pauseAfter: 750,
      voStyle: 'reveal',
      scene: P('bigText', 'c5-conclusion', {
        lines: ['The liquidity contract changed.'],
        sub: 'the outcome depended on the assets, the price, the timing',
      }),
    },
    {
      vo:
        'Across these cases, the lesson is consistent: redemption pressure is information. But it is not a complete diagnosis. You still have to examine what was requested, what was paid, how it was financed and what rights remained afterward.',
      pauseAfter: 750,
      scene: P('trioConverge', 'c5-lesson', {
        items: [
          { big: 'REQUESTED', label: 'what investors actually asked for', tone: 'gold' },
          { big: 'PAID', label: 'what the board fulfilled, and how', tone: 'up' },
          { big: 'AFTERWARD', label: 'what rights remained', tone: 'down' },
        ],
        title: 'Redemption pressure is information — not a diagnosis',
        cornerNote: 'dates and denominators on every number',
      }),
    },
  ],
};

const CH6: ChapterSpec = {
  id: 'ch6',
  title: 'The price of the exit: valuation and fees',
  beats: [
    {
      vo:
        "Now let's move from whether you can exit to the price you receive.",
      pauseAfter: 500,
      scene: P('host', 'c6-open', {
        stage: 'spot',
        gesture: 'present',
        entrance: 'walk',
        headline: 'The price\nof the exit.',
        sub: 'Most of these vehicles transact at NAV — but NAV is a valuation, not a market price.',
        kicker: 'VALUATION & FEES',
      }),
    },
    {
      vo:
        'Most of these vehicles transact at net asset value. But for a private loan or a private company, NAV is not a continuously observed exchange price. It is a valuation.',
      pauseAfter: 650,
      scene: P('navGap', 'c6-nav', { stage: 0 }),
    },
    {
      // U7 re-stage: the fairness caveat becomes a STAMP (character-led).
      vo: 'That does not mean the number is invented.',
      pauseAfter: 550,
      scene: P('stampCard', 'c6-notinvented', {
        stamp: 'NOT INVENTED',
        sub: 'But still an estimate.',
      }),
    },
    {
      // U7 re-stage: the governance requirements become a stat pair.
      vo:
        'US registered funds and BDCs operate under fair-value requirements. The board, or a designated valuation agent under board oversight, must assess valuation risks, apply and test methodologies, oversee pricing services and maintain documentation.',
      pauseAfter: 650,
      scene: P('statCards', 'c6-governed', {
        cards: [
          { big: 'GOVERNED', label: 'the board (or its valuation agent) assesses risks, tests methodologies, oversees pricing, documents everything', tag: 'fair-value requirements', tone: 'up' },
        ]
      }),
    },
    {
      // U7 re-stage: the estimate line becomes a pull-quote.
      vo: 'But a governed estimate is still an estimate.',
      pauseAfter: 650,
      voStyle: 'reveal',
      dropOut: true,
      scene: P('quoteCard', 'c6-estimate', {
        lines: ['A governed estimate is still an estimate.'],
        icon: 'shield',
      }),
    },
    {
      // U7: the marking machinery lands on aiDatacenter — the rack-field
      // room draws the valuation infrastructure (models, comps, spreads,
      // audit) as the machine hall it is, each stat a lit plaque on a rack.
      vo:
        'A loan may be marked using discounted cash flows, comparable transactions, credit spreads and assumptions about the borrower. Independent valuation firms may contribute. An annual audit provides another layer of scrutiny. None of those features creates a live market price for every asset.',
      pauseAfter: 650,
      scene: P('aiDatacenter', 'c6-nav', {
        stats: [
          { big: 'DCF', label: 'discounted cash-flow models mark the loan', tone: 'up' },
          { big: 'COMPS', label: 'comparable transactions bracket the price', tone: 'gold' },
          { big: 'SPREADS', label: 'credit spreads shape the discount rate', tone: 'up' },
          { big: 'AUDIT', label: 'the annual audit adds scrutiny — still no live price', tone: 'down' },
        ],
      }),
    },
    {
      // U7: the central friction lands on chartJourney — the film's journey
      // room draws the two repricing speeds the FEDS note names (public
      // benchmarks move daily; the private mark steps quarterly).
      vo:
        'The Federal Reserve staff note identifies the central friction: private-asset valuations can adjust more slowly than public benchmarks. If investors believe NAV will fall, they may prefer to redeem before the markdown.',
      pauseAfter: 700,
      scene: P('chartJourney', 'c6-friction', {
        title: 'Two clocks: daily prices vs the quarterly mark.',
        series: [
          { name: 'Public benchmark', tone: 'up', points: [[0, 100], [0.18, 101.5], [0.36, 99.5], [0.54, 102], [0.72, 100.5], [1, 103]] },
          { name: 'Private mark (quarterly steps)', tone: 'down', points: [[0, 100], [0.25, 100], [0.5, 100], [0.75, 100], [1, 96.5]] },
        ],
        chips: ['the lag is the run incentive'],
        source: 'Federal Reserve staff note (FEDS), October 2026 — valuation opacity and redemption incentives',
      }),
    },
    {
      vo: 'Here is the mechanism in its simplest form.',
      pauseAfter: 550,
      scene: P('navGap', 'c6-mech', { stage: 4, hypothetical: true }),
    },
    {
      vo:
        'Suppose a fund reports NAV of one hundred, but the economic value of its assets is ninety. If an investor can exit at one hundred before the mark adjusts, the difference is borne by the investors who remain.',
      pauseAfter: 700,
      voStyle: 'reveal',
      scene: P('navGap', 'c6-mech', { stage: 5, hypothetical: true }),
    },
    {
      // U7 re-stage: the reversed mechanism becomes a versus pair.
      vo:
        'Reverse the direction and the effect reverses: redeeming at an understated NAV can benefit those who stay.',
      pauseAfter: 650,
      scene: P('splitNumbers', 'c6-reverse', {
        mode: 'vs',
        stats: [
          { big: 'OVERSTATED', label: 'exit first — the stayers bear the \u221210', tone: 'down' },
          { big: 'UNDERSTATED', label: 'exit late — the stayers gain the difference', tone: 'up' },
        ],
      }),
    },
    {
      vo:
        'The issue is not that every lagged mark creates a run. It is that NAV-based subscriptions and redemptions can transfer value between entering, exiting and remaining investors when the estimate is wrong.',
      pauseAfter: 700,
      // U7 re-stage: the transfer verdict becomes a STAMP.
      scene: P('stampCard', 'c6-transfer', {
        stamp: 'NAV MOVES VALUE',
        sub: 'Between entering, exiting and remaining investors — when the estimate is wrong.',
      }),
    },
    {
      vo:
        'That is why valuation governance belongs in a liquidity analysis — not in a separate compliance appendix.',
      pauseAfter: 650,
      scene: P('host', 'c6-governance', {
        gesture: 'present',
        headline: 'Valuation governance\nbelongs in the\nliquidity analysis.',
        sub: 'Not in a separate compliance appendix.',
      }),
    },
    {
      vo:
        "Now the fees. Take BCRED's published terms as one example, not an industry average.",
      pauseAfter: 600,
      scene: P('feeStack', 'c6-fees', { stage: 0 }),
    },
    {
      vo:
        'Its management fee is 1.25 percent of NAV annually. Its income incentive fee is 12.5 percent of net investment income, subject to a five-percent hurdle and catch-up. It also has a 12.5 percent incentive allocation on realized gains, net of realized and unrealized losses.',
      pauseAfter: 650,
      scene: P('feeStack', 'c6-fees', { stage: 1 }),
    },
    {
      vo:
        'Those percentages are not added together to produce a total expense ratio. They apply to different bases.',
      pauseAfter: 650,
      voStyle: 'reveal',
      // U7 re-stage: the bases verdict becomes a STAMP.
      scene: P('stampCard', 'c6-bases', {
        stamp: 'DIFFERENT BASES',
        sub: 'Management · income incentive · realized gains — never one added-up number.',
      }),
    },
    {
      // U7 re-stage: the share-class costs become a stat pair.
      vo:
        'Then there are share-class costs. The published Class S terms include a 0.85 percent annual distribution and servicing fee and an upfront placement fee of up to 3.5 percent. Other classes have different terms.',
      pauseAfter: 650,
      scene: P('statCards', 'c6-shareclass', {
        cards: [
          { big: '0.85%', label: 'annual distribution and servicing fee (Class S)', tag: 'every year', tone: 'down' },
          { big: '3.5%', label: 'upfront placement fee, at most (Class S)', tag: 'on entry', tone: 'down' },
        ],
      }),
    },
    {
      vo:
        'A fund-of-funds structure can add another layer through the expenses of underlying funds. Financing costs also matter in a levered credit vehicle, although interest expense is not the same thing as a manager\u2019s compensation.',
      pauseAfter: 700,
      scene: P('feeStack', 'c6-fees', { stage: 3 }),
    },
    {
      vo:
        'So the professional question is not "Is the headline fee high?" It is: what is the all-in cost of the exposure I actually receive, after fees, financing, cash holdings and any underlying fund layers — and what comparable public or private exposure am I giving up?',
      pauseAfter: 750,
      scene: P('quoteCard', 'c6-allin', {
        kicker: 'THE PROFESSIONAL QUESTION',
        lines: [
          'What is the all-in cost of the exposure I actually receive — and what comparable exposure am I giving up?',
        ],
        icon: 'shield',
      }),
    },
    {
      vo:
        'A high fee is not automatically unjustified. But it raises the amount of value the manager must create before the investor benefits.',
      pauseAfter: 700,
      scene: P('host', 'c6-allin', {
        gesture: 'present',
        headline: 'A high fee raises\nthe bar the manager\nmust clear.',
        sub: 'Before the investor benefits.',
      }),
    },
  ],
};

const CH7: ChapterSpec = {
  id: 'ch7',
  title: 'The serious bull case',
  beats: [
    {
      vo:
        "At this point, the bear case is easy to make. So let's make the strongest honest bull case.",
      pauseAfter: 650,
      scene: P('host', 'c7-open', {
        stage: 'spot',
        gesture: 'present',
        entrance: 'walk',
        headline: 'The strongest\nhonest bull case.',
        sub: 'A genuine counterargument — not a token paragraph before the criticism.',
        kicker: 'THE BULL CASE',
        expression: 'warm',
        walkAcross: true,
      }),
    },
    {
      vo:
        'Traditional drawdown funds create a real operational problem. You commit capital. The manager calls it over time. Distributions arrive irregularly. You have to manage unfunded commitments, reinvest proceeds and maintain the target allocation yourself.',
      pauseAfter: 650,
      scene: P('bullCase', 'c7-bull', { side: 'drawdown' }),
    },
    {
      // U7: "the fund manages it for you" lands on ownerWorker — the two-shot
      // draws YOU-OPERATE vs THE-FUND-OPERATES, the beat's entire argument
      // in one staged pair on the shared terrain.
      vo:
        'An evergreen fund can simplify that. You make an allocation. The fund manages deployment, reinvestment and portfolio rebalancing. For an investor without a large private-markets operations team, that is valuable.',
      pauseAfter: 650,
      scene: P('ownerWorker', 'c7-answer', {
        left: { title: 'YOU OPERATE', line: 'the drawdown path — unfunded commitments, reinvestment, rebalancing, all manual', tone: 'down' },
        right: { title: 'THE FUND OPERATES', line: 'the evergreen path — one allocation, the machine does the work', tone: 'up' },
      }),
    },
    {
      // U7: the capital-efficiency argument lands on chartJourney — the
      // exposure paths drawn as the two lines the argument IS (drawdown
      // ramps over years; evergreen is exposed from day one).
      vo:
        'There is also a capital-efficiency argument. In a conventional commitment structure, uncalled capital may sit in lower-return assets while waiting to be deployed. An evergreen allocation can provide immediate exposure to an existing portfolio.',
      pauseAfter: 650,
      scene: P('chartJourney', 'c7-capital', {
        title: 'Exposure over time: ramp-in vs day one.',
        series: [
          { name: 'Drawdown fund (uncalled, then deployed)', tone: 'down', points: [[0, 0], [0.25, 0.15], [0.5, 0.4], [0.75, 0.7], [1, 1]] },
          { name: 'Evergreen (day-one exposure)', tone: 'up', points: [[0, 1], [0.25, 1], [0.5, 1], [0.75, 1], [1, 1]] },
        ],
        chips: ['capital parked vs capital working'],
        source: 'Illustrative exposure paths — a structural comparison, not a return forecast',
      }),
    },
    {
      vo:
        'But that is not free money. Immediate exposure also means immediate exposure to existing valuations, fees and portfolio risks. And comparing an evergreen\u2019s time-weighted return with a closed-end fund\u2019s internal rate of return can create a misleading comparison if cash-flow timing and reinvestment are ignored.',
      pauseAfter: 700,
      voStyle: 'reveal',
      scene: P('bullCase', 'c7-bull', { side: 'cost' }),
    },
    {
      vo:
        "Hamilton Lane's 2026 overview argues that evergreen funds can offer simpler implementation and useful diversification. It also reports favourable selected-period comparisons with buyout funds — but its evergreen sample is small and selected, and the comparison is not a controlled, like-for-like experiment.",
      pauseAfter: 700,
      scene: P('quoteCard', 'c7-hamilton', {
        kicker: 'THE EVIDENCE — AND ITS LIMITS',
        lines: [
          'Simpler implementation, useful diversification — but the evergreen sample is small and selected, and the comparison is not like-for-like.',
        ],
        icon: 'asterisk',
        sub: 'Source: Hamilton Lane 2026 evergreen overview',
      }),
    },
    {
      vo:
        'So the correct bull case is not "evergreens always outperform." It is that they can be an efficient implementation tool for long-horizon capital, provided the investor accepts the liquidity design and the manager executes well.',
      pauseAfter: 700,
      voStyle: 'reveal',
      scene: P('bigText', 'c7-correct', {
        lines: ['An efficient implementation tool', 'for long-horizon capital.'],
        sub: 'if the liquidity design is accepted — and the manager executes',
      }),
    },
    {
      vo:
        'For a pension fund with predictable liabilities, a family office with substantial liquid reserves, or an adviser allocating only genuinely long-term capital, periodic liquidity may be a reasonable compromise.',
      pauseAfter: 650,
      scene: P('bullCase', 'c7-fit', { side: 'fit' }),
    },
    {
      vo:
        'For someone treating the fund as a higher-yield cash substitute, the same structure may be inappropriate.',
      pauseAfter: 650,
      voStyle: 'reveal',
      scene: P('bullCase', 'c7-fit', { side: 'mismatch' }),
    },
    {
      vo:
        'The product does not become suitable because the investor is wealthy. It becomes suitable when the liquidity terms match the investor\u2019s obligations.',
      pauseAfter: 800,
      voStyle: 'reveal',
      dropOut: true,
      // U7 re-stage: the suitability verdict becomes a STAMP.
      scene: P('stampCard', 'c7-suitability', {
        stamp: 'TERMS vs OBLIGATIONS',
        sub: 'Suitability is a match — not a function of wealth.',
      }),
    },
  ],
};

const CH8: ChapterSpec = {
  id: 'ch8',
  title: 'The eight-question liquidity audit',
  beats: [
    {
      vo:
        'So here is the framework I would use before approving an evergreen allocation. Not a prediction of which fund will gate. A way to identify what you are actually being asked to accept.',
      pauseAfter: 700,
      scene: P('host', 'c8-open', {
        stage: 'spot',
        gesture: 'present',
        entrance: 'walk',
        headline: 'The eight-question\nliquidity audit.',
        sub: 'Not a prediction. A way to identify what you are actually being asked to accept.',
        kicker: 'THE LIQUIDITY AUDIT',
      }),
    },
    {
      vo:
        'One: what is the legal obligation? Is this an interval fund with a fundamental repurchase policy? A discretionary tender-offer fund? A non-traded BDC? An ELTIF? Ask for the exact redemption language — not the sales summary. Who can change the schedule? Who can suspend a program? What exceptions apply?',
      pauseAfter: 700,
      scene: P('auditChecklist', 'c8-audit', { q: 0 }),
    },
    {
      vo:
        'Two: what is the denominator? Five percent of shares outstanding? Five percent of NAV? Measured on which date? Can the board upsize the offer? If requests exceed capacity, how is proration calculated? Must unfulfilled requests be resubmitted? A percentage without a denominator is not a liquidity term.',
      pauseAfter: 700,
      voStyle: 'reveal',
      scene: P('auditChecklist', 'c8-audit', { q: 1 }),
    },
    {
      vo:
        'Three: where does the cash come from? Separate cash and liquid securities from undrawn credit facilities. Separate recurring portfolio repayments from new subscriptions. Then ask what happens if subscriptions stop and repayments slow. A credit line is useful, but it is not the same as unencumbered cash.',
      pauseAfter: 700,
      scene: P('auditChecklist', 'c8-audit', { q: 2 }),
    },
    {
      vo:
        'Four: what happens under a combined stress? Do not test only a five-percent redemption quarter. Model higher requests alongside zero net subscriptions, slower repayments and reduced borrowing availability. Ask which assets would be sold, at what assumed discount, and how the proceeds would be allocated. There is no universal cash buffer that makes every strategy safe. A private-equity portfolio and a direct-lending portfolio do not need the same liquidity sleeve.',
      pauseAfter: 700,
      scene: P('auditChecklist', 'c8-audit', { q: 3 }),
    },
    {
      vo:
        'Five: who checks the marks? Ask about independent valuation coverage, the proportion of assets relying on unobservable inputs, the frequency of reviews, and how public-market moves are incorporated. An annual audit is useful. It is not a guarantee that every interim NAV is realizable at that price.',
      pauseAfter: 700,
      scene: P('auditChecklist', 'c8-audit', { q: 4 }),
    },
    {
      vo:
        'Six: what is the all-in cost? Management fees. Incentive fees. Hurdles and catch-ups. Share-class fees. Financing costs. Underlying fund expenses. Early-repurchase charges. Compare total return after those costs — not the distribution rate alone. A distribution can include return of capital; it is not the same thing as investment income.',
      pauseAfter: 700,
      scene: P('auditChecklist', 'c8-audit', { q: 5 }),
    },
    {
      vo:
        'Seven: what does the history show? Review several quarters of requests, approved repurchases, fulfilment rates, subscriptions and net flows. A fund that met every request during a period of strong inflows has not necessarily demonstrated resilience during sustained net outflows. Look for the behaviour, not just the marketing claim.',
      pauseAfter: 700,
      scene: P('auditChecklist', 'c8-audit', { q: 6 }),
    },
    {
      vo:
        'Eight: what is this money for? If you need the capital for a property purchase, a tax bill, a capital call or a near-term liability, can you meet that obligation without this investment? If the answer is no, the yield is not the first question. The liquidity mismatch is.',
      pauseAfter: 750,
      voStyle: 'reveal',
      scene: P('auditChecklist', 'c8-audit', { q: 7 }),
    },
    {
      vo:
        'This is the part worth saving. Not because it predicts the future, but because it forces the future into the decision before the capital is committed.',
      pauseAfter: 800,
      voStyle: 'reveal',
      scene: P('auditChecklist', 'c8-audit', { q: -1, mode: 'words' }),
    },
  ],
};

const CH9: ChapterSpec = {
  id: 'ch9',
  title: 'The conclusion: liquidity is a system',
  beats: [
    {
      vo: "Let's return to the million dollars.",
      pauseAfter: 550,
      scene: P('statReveal', 'c9-return', { mode: 'return', opening: true }),
    },
    {
      vo:
        'The problem was never simply that the fund said "five percent." The problem was interpreting a fund-level repurchase mechanism as a personal guarantee.',
      pauseAfter: 700,
      voStyle: 'reveal',
      scene: P('statReveal', 'c9-return', { mode: 'misread' }),
    },
    {
      vo:
        'Evergreen funds are not inherently a trap. They are a genuine innovation in how private-market exposure is packaged and managed.',
      pauseAfter: 650,
      scene: P('quoteCard', 'c9-system', {
        kicker: 'THE HONEST VERDICT',
        lines: [
          'Evergreen funds are not inherently a trap. They are a genuine innovation in how private-market exposure is packaged and managed.',
        ],
        icon: 'shield',
      }),
    },
    {
      vo:
        'But they do not transform illiquid assets into cash equivalents. They create a system for sharing liquidity risk among the manager, entering investors, exiting investors and remaining investors.',
      pauseAfter: 700,
      scene: P('systemMap', 'c9-map', { stage: 0 }),
    },
    {
      vo:
        'When subscriptions, repayments and portfolio liquidity are sufficient, that system can work quietly.',
      pauseAfter: 650,
      scene: P('systemMap', 'c9-map', { stage: 1 }),
    },
    {
      vo:
        'When they are not, the contract decides who gets paid, who waits and who continues to bear the portfolio risk.',
      pauseAfter: 750,
      voStyle: 'reveal',
      scene: P('systemMap', 'c9-map', { stage: 2 }),
    },
    {
      vo:
        'So the most important sentence in this video is not "evergreen funds are dangerous." It is this:',
      pauseAfter: 700,
      scene: P('bigText', 'c9-sentence', {
        lines: ['The most important sentence', 'in this video:'],
      }),
    },
    {
      vo: 'A periodic redemption window is not the same as a guaranteed exit.',
      pauseAfter: 900,
      voStyle: 'reveal',
      dropOut: true,
      scene: P('stampCard', 'c9-window', {
        stamp: '5% \u2260 YOUR EXIT',
        sub: 'A periodic redemption window is not a guaranteed exit.',
        expression: 'serious',
      }),
    },
    {
      vo: 'Before you buy the yield, understand the queue.',
      pauseAfter: 800,
      voStyle: 'reveal',
      scene: P('bigText', 'c9-queue', { lines: ['Before you buy the yield,', 'understand the queue.'] }),
    },
    {
      vo:
        'If you are reviewing an allocation, send this to the person who will approve it. And in the comments, name the question you would put first to the manager: the legal obligation, the cash sources, or the valuation process.',
      pauseAfter: 700,
      scene: P('commentPrompt', 'c9-comments', {
        question: 'Which question would you put FIRST to the manager?',
        sub: 'the legal obligation · the cash sources · the valuation process',
      }),
    },
    {
      // U7 re-stage: the deeper question becomes a statement slam (the
      // tail's C/D rhythm alternates — no anchor run over 2).
      vo:
        'Not which brand is best. Which question exposes the risk that the brochure leaves unresolved.',
      pauseAfter: 700,
      voStyle: 'reveal',
      scene: P('bigText', 'c9-brochure', {
        lines: ['Not which brand is best.', 'Which question exposes the risk?'],
      }),
    },
    {
      vo:
        'Understand the wrapper. Stress the portfolio. Respect the contract.',
      pauseAfter: 800,
      voStyle: 'reveal',
      scene: P('endScreen', 'c9-end', {}),
    },
    {
      vo:
        'Educational analysis only. Fund terms, eligibility, tax treatment and availability differ by jurisdiction and share class. This is not a recommendation to buy, sell or redeem any investment.',
      pauseAfter: 400,
      voStyle: 'calm',
      scene: P('quoteCard', 'c9-disclaimer', {
        kicker: 'IMPORTANT — EDUCATIONAL ANALYSIS ONLY',
        lines: [
          'Fund terms, eligibility, tax treatment and availability differ by jurisdiction and share class. This is not a recommendation to buy, sell or redeem any investment.',
        ],
        icon: 'shield',
        soft: true,
        noHost: true,
      }),
    },
  ],
};

// assemble the full film — ch1-ch3 are inline above
SCRIPT.push(CH4, CH5, CH6, CH7, CH8, CH9);

// ── Upload kit metadata (from the documentary's production notes) ──────────
export const TITLE_OPTIONS = [
  'The Evergreen Fund Liquidity Trap: What "Semi-Liquid" Really Means',
  'Evergreen Funds: The 5% Liquidity Number Most Investors Misread',
  'What "Quarterly Liquidity" Actually Means in Semi-Liquid Funds (Evidence-Led)',
];

export const DESCRIPTION_BODY =
  'Evergreen funds are expanding rapidly, but "quarterly liquidity" does not mean every investor can exit every quarter. This analysis separates interval funds, tender-offer funds, non-traded BDCs and ELTIFs; examines documented 2026 redemption cases (Cliffwater, BCRED, Blue Owl OBDC II); walks through valuation lag and the fee stack; and delivers an eight-question liquidity audit you can screenshot.\n\nThe key distinction: a 5% fund-level repurchase cap is not a 5% personal withdrawal allowance. Liquidity is a feature of the wrapper, the portfolio, and the behaviour of everyone else invested beside you.';

export const DESCRIPTION_TAIL =
  'Not financial advice. Educational analysis only — fund terms, eligibility, tax treatment and availability differ by jurisdiction and share class. This is not a recommendation to buy, sell or redeem any investment.\n\nResearch cutoff: 20 November 2026 — fund terms and regulatory status move fast; recheck current offering documents before acting.\n\nSources: SEC Investor.gov interval-fund guidance · Federal Reserve staff note (FEDS, October 2026) · Preqin evergreen launch data (February 2026) · BBH 2026 institutional survey · Reuters (Cliffwater, OBDC II) · BCRED SEC filings (March & June 2026) · Blue Owl transaction release (February 2026) · Hamilton Lane 2026 evergreen overview · ELTIF 2.0 / final RTS analysis\n\n#EvergreenFunds #PrivateCredit #LiquidityTrap #SemiLiquid #DueDiligence';

export const KEY_SOURCES_LINE =
  'SEC Investor.gov · Federal Reserve FEDS note (Oct 2026) · Preqin (Feb 2026) · BBH 2026 survey · Reuters · BCRED SEC filings · Blue Owl Capital · Hamilton Lane · Dechert / EUR-Lex (ELTIF 2.0)';

export const TAGS = [
  'evergreen funds', 'semi-liquid funds', 'liquidity trap', 'private credit', 'interval funds',
  'tender offer funds', 'non-traded BDC', 'BCRED', 'Blue Owl', 'Cliffwater', 'ELTIF 2.0',
  'net asset value', 'fund redemption gates', 'quarterly liquidity', 'due diligence checklist',
  'alternative investments', 'family office', 'wealth management',
];

export const PINNED_COMMENT =
  'The key distinction: a 5% fund-level repurchase cap is not a 5% personal withdrawal allowance. Which matters more in your allocation process — the legal redemption obligation, the portfolio\u2019s cash generation, or the valuation process? Sources are in the description; fund terms must be checked individually.';

export const NEXT_VIDEO_DEFAULT =
  'NAV Lag Explained: Who Pays When the Mark Is Wrong (With the Math)';

export const VIDEO_TITLE = 'The Evergreen Fund Liquidity Trap: What "Semi-Liquid" Really Means';

/** The first-upload cut (tools/frame-dump.mjs --cut first): the cold open +
 *  the structural shift + the audit + the conclusion — the strongest
 *  self-contained half-hour-free slice for testing the edit. */
export const FIRST_UPLOAD_CUT: ChapterSpec[] = [
  { ...SCRIPT[0] },
  { ...SCRIPT[1] },
  { ...SCRIPT[7] },
  { ...SCRIPT[8] },
];

export function totalBeats(): number {
  return SCRIPT.reduce((n, c) => n + c.beats.length, 0);
}

// ── 100-JUDGE VISUAL AUDIT (defect D-33 — A 26-MINUTE FIRST UPLOAD) ────────
// "The full cut is 26.4 minutes with the D-07 repetition sitting mid-film.
// The repository already builds a FIRST_UPLOAD_CUT of 10-12 minutes — the
// panel endorses shipping that cut first. A first video must earn the long
// cut; shipping the longest version first risks burying the channel's
// best asset on its worst retention curve."
//
// THE SHIPPING ORDER IS NOW THE MODULE'S OWN LAW: SHIPPING_CUT is the
// default render/upload target (the offline pipeline reads it — precache,
// render-chapter and render-master all default to it; --cut full opts back
// into the extended cut once the first video has earned it). The studio
// still stages the full film for editing; the SHIP order is the cut.
export type CutId = 'first-upload' | 'full';

/** D-33: the cut the pipeline ships by default. */
export const CUT_ID_DEFAULT: CutId = 'first-upload';

export const SHIPPING_CUT: ChapterSpec[] = FIRST_UPLOAD_CUT;

export const CUTS: Record<CutId, { script: ChapterSpec[]; label: string; note: string }> = {
  'first-upload': {
    script: FIRST_UPLOAD_CUT,
    label: 'FIRST-UPLOAD CUT',
    note: 'ships FIRST — the cold open + the structural shift + the audit + the conclusion (the panel-endorsed first video)',
  },
  full: {
    script: SCRIPT,
    label: 'EXTENDED CUT',
    note: 'the full 26.4-minute film — ships after the first cut earns it',
  },
};
