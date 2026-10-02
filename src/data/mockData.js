const now = Date.now();
const d = (offsetDays) => new Date(now + offsetDays * 86400000).toISOString();

export const initialData = {
  users: [
    { id: 't1', firstName: 'Sarah', lastName: 'Mitchell', email: 'teacher@example.com', role: 'TEACHER' },
    { id: 's1', firstName: 'Ahmadjon', lastName: 'Karimov',    email: 'student@example.com',  role: 'STUDENT' },
    { id: 's2', firstName: 'Ali',      lastName: 'Rahimov',    email: 'ali@example.com',       role: 'STUDENT' },
    { id: 's3', firstName: 'Madina',   lastName: 'Ismoilova',  email: 'madina@example.com',    role: 'STUDENT' },
    { id: 's4', firstName: 'Sardor',   lastName: 'Tursunov',   email: 'sardor@example.com',    role: 'STUDENT' },
    { id: 's5', firstName: 'Mohira',   lastName: 'Abdullayeva',email: 'mohira@example.com',    role: 'STUDENT' },
    { id: 's6', firstName: 'Azizbek', lastName: 'Rasulov',    email: 'azizbek@example.com',   role: 'STUDENT' },
  ],

  templates: [
    { id: 'tpl1', teacherId: 't1', title: 'Write a Short Essay', type: 'WRITING',
      instructions: 'Write a 200–250 word essay on the topic: "How technology is changing education." Use clear paragraphs: an introduction, two body paragraphs, and a conclusion. Focus on accuracy and cohesion.',
      submissionTypes: ['Text'], createdAt: d(-10) },
    { id: 'tpl2', teacherId: 't1', title: 'Unit 5 Vocabulary Quiz', type: 'VOCABULARY',
      instructions: 'Study the 20 words from Unit 5. Write a sentence for each word that shows you understand its meaning. Submit your sentences as a text response.',
      submissionTypes: ['Text'], createdAt: d(-8) },
    { id: 'tpl3', teacherId: 't1', title: 'Reading Comprehension – Climate Change', type: 'READING',
      instructions: 'Read the provided article about climate change. Then answer the five comprehension questions below in full sentences.\n\n1. What is the greenhouse effect?\n2. Name three human activities that cause climate change.\n3. What are two consequences described in the article?\n4. What solutions does the author propose?\n5. Do you agree with the author\'s conclusion? Why?',
      submissionTypes: ['Text'], createdAt: d(-7) },
    { id: 'tpl4', teacherId: 't1', title: 'Grammar: Past Perfect Tense', type: 'GRAMMAR',
      instructions: 'Complete 15 sentences using the past perfect tense. Rewrite the incorrect sentences, correcting the errors. Show your understanding of the difference between simple past and past perfect.',
      submissionTypes: ['Text'], createdAt: d(-6) },
    { id: 'tpl5', teacherId: 't1', title: 'Listening Exercise – British Accents', type: 'LISTENING',
      instructions: 'Listen to the audio clip (provided in class). Answer the ten questions about what you heard. Focus on identifying specific information, not general impressions.',
      submissionTypes: ['Text'], createdAt: d(-5) },
    { id: 'tpl6', teacherId: 't1', title: 'Speaking Practice – Self Introduction', type: 'SPEAKING',
      instructions: 'Record yourself giving a 2-minute self-introduction in English. Cover: your name, where you are from, your hobbies, your future goals, and why you are learning English. Upload the audio file.',
      submissionTypes: ['Audio'], createdAt: d(-4) },
    { id: 'tpl7', teacherId: 't1', title: 'Keyword Summary Exercise', type: 'KEYWORD',
      instructions: 'Read the passage below. Identify and list 10 key words or phrases that carry the most important information. Then write a 3-sentence summary using those keywords.',
      submissionTypes: ['Text'], createdAt: d(-3) },
    { id: 'tpl8', teacherId: 't1', title: 'Summary Writing – News Article', type: 'SUMMARY',
      instructions: 'Read the news article about artificial intelligence shared in class. Write a concise 100-word summary in your own words. Do not copy sentences directly from the article.',
      submissionTypes: ['Text'], createdAt: d(-2) },
    { id: 'tpl9', teacherId: 't1', title: 'Conditional Sentences Practice', type: 'GRAMMAR',
      instructions: 'Write five original sentences for each type of conditional: zero, first, second, and third. Underline the conditional clause in each sentence. Avoid repeating the same structure.',
      submissionTypes: ['Text'], createdAt: d(-1) },
    { id: 'tpl10', teacherId: 't1', title: 'Describe a Photo', type: 'WRITING',
      instructions: 'Look at the photograph provided. Write 150–180 words describing what you see. Include details about the setting, people, actions, and atmosphere. Use the present continuous tense where appropriate.',
      submissionTypes: ['Text', 'Image'], createdAt: d(0) },
  ],

  assignments: [
    // Ahmadjon (s1)
    { id: 'a1',  templateId:'tpl1', teacherId:'t1', studentId:'s1', title:'Write a Short Essay', type:'WRITING', instructions:'Write a 200–250 word essay on "How technology is changing education."', submissionTypes:['Text'], deadline: d(3),   status:'PENDING',         createdAt: d(-5), updatedAt: d(-5) },
    { id: 'a2',  templateId:'tpl2', teacherId:'t1', studentId:'s1', title:'Unit 5 Vocabulary Quiz', type:'VOCABULARY', instructions:'Write a sentence for each of the 20 Unit 5 words.', submissionTypes:['Text'], deadline: d(-1),  status:'SUBMITTED',       createdAt: d(-6), updatedAt: d(-2) },
    { id: 'a3',  templateId:'tpl4', teacherId:'t1', studentId:'s1', title:'Grammar: Past Perfect Tense', type:'GRAMMAR', instructions:'Complete 15 sentences using the past perfect tense.', submissionTypes:['Text'], deadline: d(7),   status:'DONE', grade:88, feedback:'Excellent work! Minor errors in sentences 3 and 11.', createdAt: d(-8), updatedAt: d(-1) },

    // Ali (s2)
    { id: 'a4',  templateId:'tpl1', teacherId:'t1', studentId:'s2', title:'Write a Short Essay', type:'WRITING', instructions:'Write a 200–250 word essay on "How technology is changing education."', submissionTypes:['Text'], deadline: d(5),   status:'IN_PROGRESS',     createdAt: d(-4), updatedAt: d(-4) },
    { id: 'a5',  templateId:'tpl3', teacherId:'t1', studentId:'s2', title:'Reading Comprehension – Climate Change', type:'READING', instructions:'Answer the five comprehension questions in full sentences.', submissionTypes:['Text'], deadline: d(-3),  status:'SUBMITTED',       createdAt: d(-7), updatedAt: d(-1) },
    { id: 'a6',  templateId:'tpl5', teacherId:'t1', studentId:'s2', title:'Listening Exercise – British Accents', type:'LISTENING', instructions:'Answer the ten listening questions.', submissionTypes:['Text'], deadline: d(10),  status:'PENDING',         createdAt: d(-2), updatedAt: d(-2) },

    // Madina (s3)
    { id: 'a7',  templateId:'tpl2', teacherId:'t1', studentId:'s3', title:'Unit 5 Vocabulary Quiz', type:'VOCABULARY', instructions:'Write a sentence for each of the 20 Unit 5 words.', submissionTypes:['Text'], deadline: d(2),   status:'NEEDS_REVISION',  createdAt: d(-9), updatedAt: d(-1) },
    { id: 'a8',  templateId:'tpl6', teacherId:'t1', studentId:'s3', title:'Speaking Practice – Self Introduction', type:'SPEAKING', instructions:'Record a 2-minute self-introduction in English.', submissionTypes:['Audio'], deadline: d(4),   status:'PENDING',         createdAt: d(-3), updatedAt: d(-3) },
    { id: 'a9',  templateId:'tpl9', teacherId:'t1', studentId:'s3', title:'Conditional Sentences Practice', type:'GRAMMAR', instructions:'Write five original sentences for each type of conditional.', submissionTypes:['Text'], deadline: d(6),   status:'DONE', grade:72, feedback:'Good attempt. Work on third conditional — sentences 14 and 15 had structural errors.', createdAt: d(-10), updatedAt: d(-2) },

    // Sardor (s4)
    { id: 'a10', templateId:'tpl7', teacherId:'t1', studentId:'s4', title:'Keyword Summary Exercise', type:'KEYWORD', instructions:'Identify 10 key words and write a 3-sentence summary.', submissionTypes:['Text'], deadline: d(-5),  status:'SUBMITTED',       createdAt: d(-8), updatedAt: d(-3) },
    { id: 'a11', templateId:'tpl8', teacherId:'t1', studentId:'s4', title:'Summary Writing – News Article', type:'SUMMARY', instructions:'Write a concise 100-word summary in your own words.', submissionTypes:['Text'], deadline: d(8),   status:'PENDING',         createdAt: d(-2), updatedAt: d(-2) },
    { id: 'a12', templateId:'tpl10',teacherId:'t1', studentId:'s4', title:'Describe a Photo', type:'WRITING', instructions:'Write 150–180 words describing the photograph.', submissionTypes:['Text','Image'], deadline: d(12),  status:'DONE', grade:95, feedback:'Outstanding description! Very vivid and accurate.', createdAt: d(-11), updatedAt: d(-3) },

    // Mohira (s5)
    { id: 'a13', templateId:'tpl4', teacherId:'t1', studentId:'s5', title:'Grammar: Past Perfect Tense', type:'GRAMMAR', instructions:'Complete 15 sentences using the past perfect tense.', submissionTypes:['Text'], deadline: d(1),   status:'UNDER_REVIEW',    createdAt: d(-5), updatedAt: d(-1) },
    { id: 'a14', templateId:'tpl3', teacherId:'t1', studentId:'s5', title:'Reading Comprehension – Climate Change', type:'READING', instructions:'Answer the five comprehension questions in full sentences.', submissionTypes:['Text'], deadline: d(-2),  status:'SUBMITTED',       createdAt: d(-6), updatedAt: d(-1) },
    { id: 'a15', templateId:'tpl1', teacherId:'t1', studentId:'s5', title:'Write a Short Essay', type:'WRITING', instructions:'Write a 200–250 word essay on "How technology is changing education."', submissionTypes:['Text'], deadline: d(9),   status:'PENDING',         createdAt: d(-1), updatedAt: d(-1) },

    // Azizbek (s6)
    { id: 'a16', templateId:'tpl5', teacherId:'t1', studentId:'s6', title:'Listening Exercise – British Accents', type:'LISTENING', instructions:'Answer the ten listening questions.', submissionTypes:['Text'], deadline: d(-4),  status:'SUBMITTED',       createdAt: d(-8), updatedAt: d(-2) },
    { id: 'a17', templateId:'tpl9', teacherId:'t1', studentId:'s6', title:'Conditional Sentences Practice', type:'GRAMMAR', instructions:'Write five original sentences for each type of conditional.', submissionTypes:['Text'], deadline: d(6),   status:'DONE', grade:81, feedback:'Well done. Pay attention to comma placement in first conditional sentences.', createdAt: d(-7), updatedAt: d(-3) },
    { id: 'a18', templateId:'tpl2', teacherId:'t1', studentId:'s6', title:'Unit 5 Vocabulary Quiz', type:'VOCABULARY', instructions:'Write a sentence for each of the 20 Unit 5 words.', submissionTypes:['Text'], deadline: d(4),   status:'IN_PROGRESS',     createdAt: d(-3), updatedAt: d(-3) },
  ],

  submissions: [
    // Ahmadjon – vocab quiz submitted
    { id: 'sub1', assignedTaskId: 'a2', studentId: 's1',
      content: '1. Ambiguous: The instructions were ambiguous and caused confusion.\n2. Coherent: Her essay was coherent and well-structured.\n3. Deliberate: He made a deliberate effort to improve his vocabulary.\n4. Elaborate: The teacher asked students to elaborate on their ideas.\n5. Fundamental: Grammar is fundamental to good writing.',
      status: 'SUBMITTED', submittedAt: d(-2), createdAt: d(-2) },

    // Ali – climate change submitted
    { id: 'sub2', assignedTaskId: 'a5', studentId: 's2',
      content: '1. The greenhouse effect is the trapping of heat in Earth\'s atmosphere by gases like CO₂ and methane.\n2. Three human activities causing climate change are burning fossil fuels, deforestation, and industrial agriculture.\n3. Two consequences are rising sea levels and more frequent extreme weather events.\n4. The author proposes switching to renewable energy and reducing meat consumption.\n5. I agree with the author\'s conclusion because individual actions combined with policy changes are both necessary.',
      status: 'SUBMITTED', submittedAt: d(-1), createdAt: d(-1) },

    // Madina – vocab quiz needs revision
    { id: 'sub3', assignedTaskId: 'a7', studentId: 's3',
      content: '1. Ambiguous: The answer was ambiguous.\n2. Coherent: The text coherent.\n3. Deliberate: She deliberate to study harder.\n4. Elaborate: Please elaborate.\n5. Fundamental: It is fundamental.',
      status: 'NEEDS_REVISION', submittedAt: d(-3), createdAt: d(-3) },

    // Sardor – keyword summary submitted
    { id: 'sub4', assignedTaskId: 'a10', studentId: 's4',
      content: 'Keywords: artificial intelligence, machine learning, automation, productivity, employment, algorithm, data, decision-making, neural networks, future.\n\nSummary: Artificial intelligence and machine learning are transforming how businesses operate by automating repetitive tasks and improving decision-making through algorithms. While AI dramatically increases productivity, it also raises important questions about employment and the future of work. Society must balance the benefits of automation with the need to retrain workers for emerging roles.',
      status: 'SUBMITTED', submittedAt: d(-3), createdAt: d(-3) },

    // Mohira – grammar under review
    { id: 'sub5', assignedTaskId: 'a13', studentId: 's5',
      content: '1. By the time I arrived, she had already left.\n2. He had studied English for three years before he moved to London.\n3. They had never seen such a beautiful sunset before that evening.\n4. When I called, she had just finished her homework.\n5. I realized I had forgotten my passport at home.',
      status: 'UNDER_REVIEW', submittedAt: d(-1), createdAt: d(-1) },

    // Mohira – reading submitted
    { id: 'sub6', assignedTaskId: 'a14', studentId: 's5',
      content: '1. The greenhouse effect is the process where certain gases in the atmosphere trap heat from the sun, keeping Earth warm.\n2. Burning fossil fuels, clearing forests, and raising livestock are three key human activities contributing to climate change.\n3. The article describes rising sea levels and increased frequency of wildfires as major consequences.\n4. The author proposes investing in solar and wind energy, and reducing reliance on single-use plastics.\n5. I partly agree — individual action matters but government regulation is also essential.',
      status: 'SUBMITTED', submittedAt: d(-1), createdAt: d(-1) },

    // Azizbek – listening submitted
    { id: 'sub7', assignedTaskId: 'a16', studentId: 's6',
      content: '1. The speaker mentions three places: London, Edinburgh, and Manchester.\n2. The main topic of the conversation is public transportation.\n3. The woman prefers taking the train over driving.\n4. The train journey takes approximately two and a half hours.\n5. The man expresses surprise at how affordable the tickets are.',
      status: 'SUBMITTED', submittedAt: d(-2), createdAt: d(-2) },
  ],
};
