/**
 * Sample IELTS Academic Reading Test HTML
 * Includes 3 passages, 40 questions, and a full Answer Key table at the bottom.
 * Useful for teachers to test AI parsing with 1 click.
 */
export const SAMPLE_IELTS_READING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cambridge IELTS 18 - Academic Reading Test 1</title>
</head>
<body>
  <header>
    <h1>Cambridge IELTS 18 - Academic Reading Test 1</h1>
    <p>Time Allowed: 60 minutes | 40 Questions</p>
  </header>

  <!-- ==================== PASSAGE 1 ==================== -->
  <section class="reading-passage" id="passage-1">
    <h2>READING PASSAGE 1: Urban Farming and Vertical Agriculture</h2>
    <p>You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.</p>
    
    <div class="passage-text">
      <p>Paragraph A: By the year 2050, nearly 80 percent of the earth's population will reside in urban centres. Applying the most conservative estimates to current demographic trends, the human population will increase by roughly three billion people by then. An estimated 109 hectares of new land (about 20% larger than Brazil) will be needed to grow enough food to feed them, if traditional farming practices continue as they are practiced today. At present, throughout the world, over 80% of the land that is suitable for raising crops is in use. Historically, some 15% of that has been laid waste by poor management practices.</p>

      <p>Paragraph B: The concept of indoor farming is not entirely new, since hothouse production of tomatoes and other produce has been in vogue for some time. What is new is the urgent need to scale up this technology to accommodate another three billion people. Many believe an entirely new approach to agriculture is required, employing cutting-edge technologies. One such proposal is for 'Vertical Farms'—multi-storey buildings situated in urban environments where crops can be grown year-round in controlled indoor conditions.</p>

      <p>Paragraph C: Vertical farming offers immense advantages over conventional open-field agriculture. Firstly, crops would be produced year-round, as they would be shielded from inclement weather like droughts, floods, and severe frost. All food could be grown organically, eliminating the need for chemical fertilizers, pesticides, and herbicides. Furthermore, vertical agriculture would dramatically reduce fossil fuel consumption by eradicating the need for tractors, plows, and long-distance transport from rural farms to metropolitan supermarkets.</p>

      <p>Paragraph D: However, vertical farming also faces significant challenges. The most prominent disadvantage is the massive amount of electricity required to supply artificial lighting to crops that do not receive direct sunlight. Unlike outdoor plants that rely on free solar radiation, indoor plants require high-powered LED lighting arrays running up to 18 hours per day. Some critics estimate that the energy costs alone could make indoor vegetables prohibitively expensive compared to conventionally grown field produce.</p>
    </div>

    <div class="questions-section">
      <h3>Questions 1–7: True / False / Not Given</h3>
      <p>Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE, or NOT GIVEN.</p>
      
      <p>1. Traditional farming will require an area larger than Brazil to feed humanity by 2050.</p>
      <p>2. Vertical farming eliminates the necessity for artificial chemical pesticides.</p>
      <p>3. Vertical farming has already replaced 15% of traditional agricultural land worldwide.</p>
      <p>4. Indoor crops are completely immune to damage caused by adverse weather conditions.</p>
      <p>5. Vertical farming produces more carbon emissions from tractors than conventional farming.</p>
      <p>6. Artificial lighting is a primary source of high operating costs for vertical farms.</p>
      <p>7. Consumers in urban areas have expressed hesitation about purchasing indoor-grown vegetables.</p>

      <h3>Questions 8–13: Sentence Completion</h3>
      <p>Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.</p>
      <p>8. Urban agricultural proposals recommend multi-storey structures known as ________ to produce food.</p>
      <p>9. The high consumption of ________ is the largest single obstacle confronting indoor growers.</p>
      <p>10. Modern indoor farming systems utilize specialized high-powered ________ to sustain photosynthesis.</p>
      <p>11. Protected environments allow farmers to cultivate agricultural produce ________ without seasonal interruptions.</p>
      <p>12. Traditional rural food systems waste vast energy during long-distance ________ to urban grocery stores.</p>
      <p>13. Historical agricultural mismanagement has caused the destruction of approximately ________ of available arable land.</p>
    </div>
  </section>

  <!-- ==================== PASSAGE 2 ==================== -->
  <section class="reading-passage" id="passage-2">
    <h2>READING PASSAGE 2: The Secret Communication of Forest Trees</h2>
    <p>You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.</p>
    
    <div class="passage-text">
      <p>Paragraph A: For centuries, botanists and forestry scientists viewed the forest primarily as a battleground of intense competition. In this traditional Darwinian view, every individual tree fought tooth and nail against its neighbors for access to sunlight, soil moisture, and essential subterranean minerals. Taller trees shaded out smaller competitors, while expansive root systems monopolized groundwater supplies.</p>

      <p>Paragraph B: However, groundbreaking research conducted over the past three decades has radically altered this understanding. Scientists have discovered that trees are interconnected beneath the forest floor by vast subterranean networks of mycorrhizal fungi. This fungal web—often affectionately dubbed the 'Wood Wide Web'—links the root tips of individual trees across species barriers, creating a complex underground biological communication channel.</p>

      <p>Paragraph C: Through this fungal network, trees engage in remarkable acts of mutual resource distribution. Healthy mature trees, often referred to as 'mother trees', will actively channel excess carbon sugars, nitrogen, and water to younger saplings growing in deep forest shade where sunlight is scarce. If a mother tree is dying, she frequently dumps her remaining store of carbon into the communal network to nourish neighboring saplings.</p>

      <p>Paragraph D: In addition to nutrient transfer, the fungal network functions as an early-warning defense system. When an insect pest attacks a tree, that tree releases chemical warning signals through the fungal network to neighboring trees. Within hours of receiving the signal, neighboring trees synthesize unpalatable tannins and defensive chemicals in their leaves to deter incoming swarms before the insects even arrive.</p>
    </div>

    <div class="questions-section">
      <h3>Questions 14–18: Matching Information</h3>
      <p>Which paragraph contains the following information? Write the correct letter, A–D.</p>
      <p>14. An explanation of how older trees assist vulnerable younger saplings.</p>
      <p>15. The historical scientific perspective that trees were purely competitive organisms.</p>
      <p>16. Details of defensive biochemical reactions triggered by underground alerts.</p>
      <p>17. The identification of subterranean mycorrhizal fungi connecting distinct tree species.</p>
      <p>18. Description of dying trees transferring stored nutrients into the shared community.</p>

      <h3>Questions 19–22: Multiple Choice</h3>
      <p>Choose the correct letter, A, B, C, or D.</p>
      <p>19. According to the traditional scientific perspective discussed in Paragraph A, trees:
         A. Collaborated to preserve scarce rainwater.
         B. Competed relentlessly for sunlight and subterranean resources.
         C. Communicated through airborne fungal spores.
         D. Evolved to share canopy space equally.</p>

      <p>20. What is the primary function of the 'Wood Wide Web'?
         A. To poison rival plant species with chemical toxins.
         B. To anchor heavy tree trunks into unstable soil layers.
         C. To distribute resources and transmit warning signals between trees.
         D. To absorb carbon dioxide directly from the subterranean atmosphere.</p>

      <p>21. When attacked by leaf-eating insects, a connected tree will:
         A. Shed all of its leaves immediately to starve the attackers.
         B. Send chemical alert messages through mycorrhizal fungal networks.
         C. Absorb extra water from neighboring trees to produce resin.
         D. Release toxic gas to poison the subterranean soil.</p>

      <p>22. In response to an early-warning signal, undamaged neighboring trees produce:
         A. Unpalatable defensive tannins in their foliage.
         B. Sweet sap to attract predatory birds.
         C. Deeper taproots to avoid surface infestation.
         D. Extra flowers to accelerate reproduction.</p>

      <h3>Questions 23–26: Summary Completion</h3>
      <p>Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.</p>
      <p>Recent research reveals that forest trees form mutual underground associations through 23. ________ fungi. Mature specimens, known as 24. ________, actively supply carbon and water to shaded seedlings. When pests threaten a tree, 25. ________ are transmitted underground, prompting unaffected neighbors to produce protective 26. ________ in advance of attack.</p>
    </div>
  </section>

  <!-- ==================== PASSAGE 3 ==================== -->
  <section class="reading-passage" id="passage-3">
    <h2>READING PASSAGE 3: The Evolutionary Psychology of Innovation</h2>
    <p>You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.</p>
    
    <div class="passage-text">
      <p>Paragraph A: What drives human beings to invent, create, and pioneer novel solutions? Throughout human history, technological and social innovations have propelled our species from nomadic hunter-gatherers utilizing rudimentary flint tools to an interstellar-exploring, globally connected civilization. Yet evolutionary psychologists have long puzzled over why individual humans engage in risky innovation when evolutionary survival typically favors adherence to proven, conservative behaviors.</p>

      <p>Paragraph B: Novel research indicates that innovation is deeply intertwined with cognitive flexibility and social collaboration. Contrary to the romanticized mythology of the 'lone genius' inventing in isolation, true breakthroughs almost invariably arise from the cross-pollination of preexisting concepts across diverse disciplines. Innovation is inherently cumulative; it thrives in densely populated social hubs where ideas can collide and recombine freely.</p>

      <p>Paragraph C: Furthermore, psychological studies reveal that a willingness to embrace failure is a necessary prerequisite for creative breakthroughs. Organizations that heavily penalize mistakes inadvertently foster risk-averse cultures that stifle novel discovery. Evolutionary biology suggests that human playfulness and exploratory curiosity serve as vital evolutionary buffers, allowing individuals to test unconventional hypotheses in low-stakes environments before applying them to critical survival challenges.</p>
    </div>

    <div class="questions-section">
      <h3>Questions 27–31: Multiple Choice</h3>
      <p>Choose the correct letter, A, B, C, or D.</p>
      <p>27. Why have evolutionary psychologists found innovation puzzling?
         A. Primitive humans lacked the cranial capacity for creative thinking.
         B. Survival instincts generally favor safe, established behavior over risky experimentation.
         C. Early tools caused more injuries than hunting successes.
         D. Genetic mutations prevent most individuals from thinking abstractly.</p>

      <p>28. The concept of the 'lone genius' is described by the author as:
         A. A scientifically validated psychological model.
         B. The primary mechanism driving industrial advancement.
         C. A romanticized myth that overlooks social collaboration.
         D. A behavioral trait common among nomadic hunter-gatherers.</p>

      <p>29. Technological innovation is described in Paragraph B as:
         A. Inherently cumulative and reliant on concept cross-pollination.
         B. Dependent solely on rare genetic intelligence spikes.
         C. A recent phenomenon originating in the industrial age.
         D. Highly detrimental to social cohesion in dense cities.</p>

      <p>30. What type of institutional environment discourages breakthrough thinking?
         A. Academic universities with strict grading criteria.
         B. Organizations that severely penalize errors and failed experiments.
         C. Social hubs with high population density.
         D. Competitive sports leagues with rigid rules.</p>

      <p>31. Human playfulness is characterized from an evolutionary viewpoint as:
         A. A waste of vital metabolic energy during hunting.
         B. An evolutionary mechanism for testing ideas in low-risk contexts.
         C. A social display designed purely to attract mates.
         D. An ancient instinct that modern education should suppress.</p>

      <h3>Questions 32–36: Yes / No / Not Given</h3>
      <p>Do the following statements agree with the views of the writer? Write YES, NO, or NOT GIVEN.</p>
      <p>32. Early hunter-gatherers preferred using flint tools over bone implements.</p>
      <p>33. Evolutionary survival heavily favors adherence to established traditions.</p>
      <p>34. Solitary inventors produce superior technological innovations compared to teams.</p>
      <p>35. Punishing mistakes leads to organizational risk-aversion.</p>
      <p>36. Children exhibit greater exploratory curiosity than adult scientists.</p>

      <h3>Questions 37–40: Sentence Completion</h3>
      <p>Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.</p>
      <p>37. Breakthrough inventions depend heavily on a mental attribute known as ________.</p>
      <p>38. Innovative concepts flourish most effectively inside densely populated ________.</p>
      <p>39. An institutional willingness to accept ________ is essential for fostering creativity.</p>
      <p>40. Human exploratory curiosity enables individuals to evaluate ideas within ________ settings.</p>
    </div>
  </section>

  <!-- ==================== OFFICIAL ANSWER KEY ==================== -->
  <footer class="answer-key-section">
    <h2>OFFICIAL ANSWER KEY (Questions 1–40)</h2>
    <table class="answers-table" border="1" cellpadding="6">
      <thead>
        <tr>
          <th>Question</th>
          <th>Correct Answer</th>
          <th>Question</th>
          <th>Correct Answer</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>TRUE</td><td>21</td><td>B</td></tr>
        <tr><td>2</td><td>TRUE</td><td>22</td><td>A</td></tr>
        <tr><td>3</td><td>FALSE</td><td>23</td><td>mycorrhizal</td></tr>
        <tr><td>4</td><td>TRUE</td><td>24</td><td>mother trees</td></tr>
        <tr><td>5</td><td>FALSE</td><td>25</td><td>chemical warning signals</td></tr>
        <tr><td>6</td><td>TRUE</td><td>26</td><td>tannins</td></tr>
        <tr><td>7</td><td>NOT GIVEN</td><td>27</td><td>B</td></tr>
        <tr><td>8</td><td>vertical farms</td><td>28</td><td>C</td></tr>
        <tr><td>9</td><td>electricity</td><td>29</td><td>A</td></tr>
        <tr><td>10</td><td>LED lighting</td><td>30</td><td>B</td></tr>
        <tr><td>11</td><td>year-round</td><td>31</td><td>B</td></tr>
        <tr><td>12</td><td>transport</td><td>32</td><td>NOT GIVEN</td></tr>
        <tr><td>13</td><td>15%</td><td>33</td><td>YES</td></tr>
        <tr><td>14</td><td>C</td><td>34</td><td>NO</td></tr>
        <tr><td>15</td><td>A</td><td>35</td><td>YES</td></tr>
        <tr><td>16</td><td>D</td><td>36</td><td>NOT GIVEN</td></tr>
        <tr><td>17</td><td>B</td><td>37</td><td>cognitive flexibility</td></tr>
        <tr><td>18</td><td>C</td><td>38</td><td>social hubs</td></tr>
        <tr><td>19</td><td>B</td><td>39</td><td>failure</td></tr>
        <tr><td>20</td><td>C</td><td>40</td><td>low-stakes</td></tr>
      </tbody>
    </table>
  </footer>
</body>
</html>
`;
