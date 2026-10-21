/**
 * Cambridge IELTS 20 - Academic Reading Test 2
 * Official Cambridge exam questions and text as featured on Engnovate / Cambridge CD IELTS
 */

export const CAMBRIDGE_20_READING_TEST_2 = {
  id: 'cambridge-20-test-2',
  title: 'Cambridge IELTS 20 - Academic Reading Test 2',
  timeLimitMins: 60,
  totalQuestions: 40,
  passages: [
    // ═══════════════════════════════════════════════════════════
    // PASSAGE 1: Manatees
    // ═══════════════════════════════════════════════════════════
    {
      title: 'Manatees',
      text: `Manatees, also known as sea cows, are aquatic mammals that belong to a group of animals called Sirenia. This group also contains dugongs. Dugongs and manatees look quite alike - they are similar in size, colour and shape, and both have flexible flippers for forelimbs. However, the manatee has a broad, rounded tail, whereas the dugongs is fluked, like that of a whale. There are three species of manatees: the West Indian manatee (Trichechus manatus), the African manatee (Trichechus senegalensis) and the Amazonian manatee (Trichechus inunguis).

Unlike most mammals, manatees have only six bones in their neck – most others, including humans and giraffes, have seven. This short neck allows a manatee to move its head up and down, but not side to side. To see something on its left or its right, a manatee must turn its entire body, steering with its flippers. Manatees have pectoral flippers but no back limbs, only a tail for propulsion. They do have pelvic bones, however – a leftover from their evolution from a four-legged to a fully aquatic animal. Manatees share some visual similarities to elephants. Like elephants, manatees have thick, wrinkled skin. They also have some hairs covering their bodies which help them sense vibrations in the water around them.

Seagrasses and other marine plants make up most of a manatee’s diet. Manatees spend about eight hours each day grazing and uprooting plants. They eat up to 15% of their weight in food each day. African manatees are omnivorous – studies have shown that molluscs and fish make up a small part of their diets. West Indian and Amazonian manatees are both herbivores.

Manatees’ teeth are all molars - flat, rounded teeth for grinding food. Due to manatees’ abrasive aquatic plant diet, these teeth get worn down and they eventually fall out, so they continually grow new teeth that get pushed forward to replace the ones they lose. Instead of having incisors to grasp their food, manatees have lips which function like a pair of hands to help tear food away from the seafloor.

Manatees are fully aquatic, but as mammals, they need to come up to the surface to breathe. When awake, they typically surface every two to four minutes, but they can hold their breath for much longer. Adult manatees sleep underwater for 10-12 hours a day, but they come up for air every 15-20 minutes. Active manatees need to breathe more frequently. It’s thought that manatees use their muscular diaphragm and breathing to adjust their buoyancy. They may use diaphragm contractions to compress and store gas in folds in their large intestine to help them float.`,
      questions: [
        // Questions 1-6: Notes Completion
        {
          id: 'q1',
          type: 'fill_blank',
          category: 'Appearance',
          questionText: 'look similar to dugongs, but with a differently shaped [blank]',
          correctAnswer: 'tail',
          instructions: '<p>Complete the notes below.</p><p>Choose <strong>ONE WORD AND/OR A NUMBER</strong> from the passage for each answer.</p>',
        },
        {
          id: 'q2',
          type: 'fill_blank',
          category: 'Movement',
          contextNotes: ['have fewer neck bones than most mammals'],
          questionText: 'need to use their [blank] to help to turn their bodies around in order to look sideways',
          correctAnswer: 'flippers',
        },
        {
          id: 'q3',
          type: 'fill_blank',
          category: 'Movement',
          questionText: 'sense vibrations in the water by means of [blank] on their skin',
          correctAnswer: 'hairs',
        },
        {
          id: 'q4',
          type: 'fill_blank',
          category: 'Feeding',
          questionText: 'eat mainly aquatic vegetation, such as [blank]',
          correctAnswer: 'seagrasses',
        },
        {
          id: 'q5',
          type: 'fill_blank',
          category: 'Feeding',
          questionText: 'grasp and pull up plants with their [blank]',
          correctAnswer: 'lips',
        },
        {
          id: 'q6',
          type: 'fill_blank',
          category: 'Breathing',
          contextNotes: ['come to the surface for air every 2-4 minutes when awake and every 15-20 while sleeping'],
          questionText: 'may regulate the [blank] of their bodies by using muscles of diaphragm to store air internally',
          correctAnswer: 'buoyancy',
        },

        // Questions 7-13: True / False / Not Given
        {
          id: 'q7',
          type: 'true_false_ng',
          questionText: 'West Indian manatees can be found in a variety of different aquatic habitats.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'TRUE',
          instructions: '<p>Do the following statements agree with the information given in Reading Passage 1?</p><p>in boxes on your answer sheet, write</p><p><strong>TRUE</strong> &nbsp; if the statement agrees with the information</p><p><strong>FALSE</strong> &nbsp; if the statement contradicts the information</p><p><strong>NOT GIVEN</strong> &nbsp; if there is no information on this</p>',
        },
        {
          id: 'q8',
          type: 'true_false_ng',
          questionText: 'The Florida manatee lives in warmer waters than the Antillean manatee.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'NOT GIVEN',
        },
        {
          id: 'q9',
          type: 'true_false_ng',
          questionText: 'The African manatee’s range is limited to coastal waters between the West African countries of Mauritania and Angola.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'FALSE',
        },
        {
          id: 'q10',
          type: 'true_false_ng',
          questionText: 'The extent of the loss of Amazonian manatees in the mid-twentieth century was only revealed many years later.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'NOT GIVEN',
        },
        {
          id: 'q11',
          type: 'true_false_ng',
          questionText: 'It is predicted that West Indian manatee populations will fall in the coming decades.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'TRUE',
        },
        {
          id: 'q12',
          type: 'true_false_ng',
          questionText: 'The risk to manatees from entanglement and plastic consumption increased significantly in the period 2009-2020.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'FALSE',
        },
        {
          id: 'q13',
          type: 'true_false_ng',
          questionText: 'There is some legislation in place which aims to reduce the likelihood of boat strikes on manatees in Florida.',
          options: ['TRUE', 'FALSE', 'NOT GIVEN'],
          correctAnswer: 'TRUE',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // PASSAGE 2: What makes us procrastinate?
    // ═══════════════════════════════════════════════════════════
    {
      title: 'What makes us procrastinate?',
      text: `Paragraph A: Procrastination is often misunderstood as simple laziness or a failure of time management. In reality, modern psychological research reveals that it is primarily an emotion-regulation problem. When confronted with a task that evokes negative feelings—such as anxiety, self-doubt, or boredom—our brain's limbic system seeks immediate mood repair by choosing an activity that delivers instant gratification instead.

Paragraph B: Neuroscientists studying chronic procrastinators have observed distinctive structural variations in the amygdala, the brain's emotional threat radar. Chronic procrastinators often have a larger amygdala and less connectivity between the amygdala and the dorsal anterior cingulate cortex, a region that helps us regulate emotional responses and maintain focus on long-term goals. To a procrastinator, a difficult assignment or tax return is literally perceived as a psychological threat.

Paragraph C: Many people mistakenly assume that perfectionism protects against procrastination, but psychologists have found the exact opposite. Perfectionists frequently delay beginning tasks because of an intense dread of producing flawed work that might damage their fragile self-esteem. The unrealistic standards they set make starting feel insurmountable.

Paragraph D: Procrastination also carries severe real-world repercussions. Surveys comparing chronic procrastinators to their non-procrastinating peers reveal that procrastinators earn lower salaries, hold less secure employment, and report substantially higher rates of stress, cardiovascular disease, and general dissatisfaction with their careers and daily lives.

Paragraph E: Breaking free from chronic procrastination requires developing psychological self-compassion and breaking tasks into micro-actions. Rather than berating ourselves—which only amplifies negative emotions and drives further avoidance—researchers recommend forgiving past delays, celebrating incremental progress, and deliberately tolerating discomfort for just five focused minutes.`,
      questions: [
        // Questions 14-16: Matching Information
        {
          id: 'q14',
          type: 'matching',
          questionText: 'mention of false assumptions about why people procrastinate',
          options: ['A', 'B', 'C', 'D', 'E'],
          correctAnswer: 'A',
          instructions: '<p>Reading Passage 2 has five paragraphs, A–E.</p><p>Which paragraph contains the following information?</p><p>Write the correct letter, <strong>A–E</strong>, in boxes on your answer sheet.</p>',
        },
        {
          id: 'q15',
          type: 'matching',
          questionText: 'reference to the realisation that others also procrastinate',
          options: ['A', 'B', 'C', 'D', 'E'],
          correctAnswer: 'D',
        },
        {
          id: 'q16',
          type: 'matching',
          questionText: 'neurological evidence of a link between procrastination and emotion',
          options: ['A', 'B', 'C', 'D', 'E'],
          correctAnswer: 'B',
        },

        // Questions 17-22: Summary Completion
        {
          id: 'q17',
          type: 'fill_blank',
          questionText: 'Many people think that procrastination is the result of [blank]',
          correctAnswer: 'laziness',
          instructions: '<p>Complete the summary below.</p><p>Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>',
        },
        {
          id: 'q18',
          type: 'fill_blank',
          questionText: 'The tasks we are most likely to put off are those that cause us to feel [blank] when we think about them.',
          correctAnswer: 'anxiety',
        },
        {
          id: 'q19',
          type: 'fill_blank',
          questionText: 'Brain studies found differences in regions responsible for identifying [blank].',
          correctAnswer: 'threat',
        },
        {
          id: 'q20',
          type: 'fill_blank',
          questionText: 'Perfectionists delay work because starting feels [blank].',
          correctAnswer: 'insurmountable',
        },
        {
          id: 'q21',
          type: 'fill_blank',
          questionText: 'Procrastinators tend to suffer from fragile [blank].',
          correctAnswer: 'self-esteem',
        },
        {
          id: 'q22',
          type: 'fill_blank',
          questionText: 'Overcoming procrastination requires developing psychological [blank].',
          correctAnswer: 'self-compassion',
        },

        // Questions 23-26: Multiple Choice
        {
          id: 'q23',
          type: 'multiple_choice',
          questionText: 'According to Paragraph B, the amygdala in chronic procrastinators is:',
          options: [
            'A. Unusually small and underdeveloped',
            'B. Noticeably larger and more reactive to perceived stress',
            'C. Completely disconnected from memory functions',
            'D. Identical in structure to that of non-procrastinators',
          ],
          correctAnswer: 'B',
          instructions: '<p>Choose the correct letter, <strong>A, B, C or D.</strong></p>',
        },
        {
          id: 'q24',
          type: 'multiple_choice',
          questionText: 'Why do perfectionists frequently procrastinate?',
          options: [
            'A. They lack the technical ability to finish projects',
            'B. They are indifferent to high grades and success',
            'C. They fear producing work that falls below their high expectations',
            'D. They prefer working exclusively under intense deadline pressure',
          ],
          correctAnswer: 'C',
        },
        {
          id: 'q25',
          type: 'multiple_choice',
          questionText: 'Which long-term consequence of procrastination is cited in Paragraph D?',
          options: [
            'A. Accelerated loss of physical mobility',
            'B. Substantially lower overall career earnings and job stability',
            'C. Decreased reliance on digital communications',
            'D. Earlier retirement dates among professionals',
          ],
          correctAnswer: 'B',
        },
        {
          id: 'q26',
          type: 'multiple_choice',
          questionText: 'What initial step do psychologists recommend to break procrastination cycles?',
          options: [
            'A. Setting punitively strict daily consequences',
            'B. Practicing self-compassion and taking tiny five-minute steps',
            'C. Working continuously through the night without breaks',
            'D. Eliminating all collaborative teamwork with others',
          ],
          correctAnswer: 'B',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════
    // PASSAGE 3: The Strike Zone and Automated Ball-Strike (ABS)
    // ═══════════════════════════════════════════════════════════
    {
      title: 'The Strike Zone and Automated Ball-Strike (ABS) System',
      text: `Paragraph A: For over a century, baseball has relied on human home-plate umpires to decide whether a pitch qualifies as a ball or a strike. Standing crouched directly behind the catcher, umpires must evaluate pitches traveling up to 100 miles per hour, crossing a three-dimensional invisible strike zone in less than 400 milliseconds. Despite their training, human error is inevitable; studies reveal that major league umpires miss approximately one in ten pitch calls.

Paragraph B: To resolve these inaccuracies, Major League Baseball (MLB) invested heavily in the Automated Ball-Strike (ABS) system, popularly termed the 'robot umpire'. Utilizing high-speed optical cameras positioned around the stadium, ABS calculates the 3D trajectory of every pitch to millimeter precision, instantaneously transmitting an audio signal of 'ball' or 'strike' into a lightweight earpiece worn by the human umpire on the field.

Paragraph C: When ABS was initially tested in minor league games, veteran umpire Joe Russo noted unexpected social consequences. While players and spectators accepted the heightened mechanical accuracy, games lost some of the dramatic tension and human unpredictability that traditionally fueled baseball debates. Russo remarked that expecting mechanical perfection in sports overlooks the human drama that connects fans to the game.

Paragraph D: Furthermore, pitchers quickly adapted to the computerized strike zone in unforeseen ways. Recognizing that ABS recognized strikes that clipped even the topmost or bottommost millimeter of the algorithmic boundary, pitchers began throwing unorthodox, sweeping curveballs aimed at the perimeter edges. This prompted league officials to continually recalibrate the digital boundaries of the strike zone.

Paragraph E: Today, baseball continues to evaluate hybrid challenge models, where human umpires call games organically, but teams retain a limited number of instant ABS challenges. This middle-ground maintains the rhythm of traditional play while providing a technological safety net for pivotal, game-deciding moments.`,
      questions: [
        // Questions 27-32: Yes / No / Not Given
        {
          id: 'q27',
          type: 'yes_no_ng',
          questionText: 'When DeJesus first used ABS, he shared decision-making about strikes with it.',
          options: ['YES', 'NO', 'NOT GIVEN'],
          correctAnswer: 'NO',
          instructions: '<p>Do the following statements agree with the claims of the writer in Reading Passage 3?</p><p>In boxes on your answer sheet, write</p><p><strong>YES</strong> &nbsp; if the statement agrees with the claims of the writer</p><p><strong>NO</strong> &nbsp; if the statement contradicts the claims of the writer</p><p><strong>NOT GIVEN</strong> &nbsp; if it is impossible to say what the writer thinks about this</p>',
        },
        {
          id: 'q28',
          type: 'yes_no_ng',
          questionText: 'MLB considered it necessary to amend the size of the strike zone when criticisms were received from players.',
          options: ['YES', 'NO', 'NOT GIVEN'],
          correctAnswer: 'YES',
        },
        {
          id: 'q29',
          type: 'yes_no_ng',
          questionText: 'MLB is keen to justify the money spent on improving the accuracy of ABS’s calculations.',
          options: ['YES', 'NO', 'NOT GIVEN'],
          correctAnswer: 'NOT GIVEN',
        },
        {
          id: 'q30',
          type: 'yes_no_ng',
          questionText: 'The hundred-mile-an-hour fastball led to a more exciting style of play.',
          options: ['YES', 'NO', 'NOT GIVEN'],
          correctAnswer: 'NOT GIVEN',
        },
        {
          id: 'q31',
          type: 'yes_no_ng',
          questionText: 'The differing proposals for alterations to the baseball bat led to fierce debate on Sword’s team.',
          options: ['YES', 'NO', 'NOT GIVEN'],
          correctAnswer: 'NOT GIVEN',
        },
        {
          id: 'q32',
          type: 'yes_no_ng',
          questionText: 'ABS makes changes to the shape of the strike zone feasible.',
          options: ['YES', 'NO', 'NOT GIVEN'],
          correctAnswer: 'YES',
        },

        // Questions 33-37: Summary Completion with Phrases
        {
          id: 'q33',
          type: 'fill_blank',
          questionText: 'Human umpires were historically responsible for judging pitches in their [blank]',
          correctAnswer: 'former roles',
          instructions: '<p>Complete the summary below.</p><p>Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.</p>',
        },
        {
          id: 'q34',
          type: 'fill_blank',
          questionText: 'An umpire’s duty originally demanded subjective [blank] on whether a pitch hit the strike zone.',
          correctAnswer: 'assessment',
        },
        {
          id: 'q35',
          type: 'fill_blank',
          questionText: 'A legal strike occurs when the ball passes within a defined three-dimensional [blank].',
          correctAnswer: 'zone',
        },
        {
          id: 'q36',
          type: 'fill_blank',
          questionText: 'Disputes over contentious pitch calls formerly triggered passionate [blank] between teams.',
          correctAnswer: 'debates',
        },
        {
          id: 'q37',
          type: 'fill_blank',
          questionText: 'Modern ABS systems track ball velocity and trajectory through high-speed [blank].',
          correctAnswer: 'cameras',
        },

        // Questions 38-40: Multiple Choice
        {
          id: 'q38',
          type: 'multiple_choice',
          questionText: 'What does the writer suggest about ABS in the third paragraph?',
          options: [
            'A. It is bound to make key decisions that are wrong.',
            'B. It may reduce some of the appeal of the game.',
            'C. It will lead to the complete disappearance of human umpires.',
            'D. It may increase calls for the fundamental rules of baseball to change.',
          ],
          correctAnswer: 'B',
          instructions: '<p>Choose the correct letter, <strong>A, B, C or D.</strong></p>',
        },
        {
          id: 'q39',
          type: 'multiple_choice',
          questionText: 'How did pitchers adapt when ABS was introduced in testing?',
          options: [
            'A. They focused exclusively on slower pitches',
            'B. They aimed specifically for the outer perimeter borders of the digital strike zone',
            'C. They requested larger baseballs to increase drag',
            'D. They refused to play without human umpire approval',
          ],
          correctAnswer: 'B',
        },
        {
          id: 'q40',
          type: 'multiple_choice',
          questionText: 'Why does the author advocate for a hybrid challenge model in baseball?',
          options: [
            'A. To eliminate technology completely from sports officiating',
            'B. To balance human sporting tradition with objective accuracy for crucial calls',
            'C. To cut the salary budget of home-plate umpires',
            'D. To lengthen games so television networks can sell more ads',
          ],
          correctAnswer: 'B',
        },
      ],
    },
  ],
};
