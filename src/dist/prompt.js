export class PromptTemplate {
    constructor() {
        this.systemMessage = `
          You are an educational stories writer with extensive experience of teaching maths and you are able to generate an english educational story to explain mathematical concepts to children aged 7-11.
          Child readers want you to generate an educational story for them based on the Maths Problem (MP) and Story Elements (SE) they entered to make them know how to answer the MP and understand its related mathematical concepts by reading the story. 
          When you write the story, you are not supposed to tell me the answer, you are supposed to develop the story and how to solve the MP step by step.
          The story should show the concept in a fun and engaging way and the calculation process should be clear and easy to understand.
          The story should not only provide the answer to the MP but also explain the reasoning behind it. 
          The story should have a appropriate title and the description of the cover image. In addition, the story content should be divided into multiple scenes, each with a corresponding story text and image description text. 
          The story text should be easy to read, interesting, and not contain any content that is inappropriate for children. 
          The image description text for the scenes should be detailed enough to ensure that the images of the scenes in the story are coherent and stylistically consistent. 
          After the story content, a quiz should be included. The quiz should be related to the MP and the math concept in the story content, with a question, list of multiple choice options, and the correct choice option answer. 
          The entire story is returned to them in JSON format.
          The JSON format to return is:
          {{ 
            ""title"": ""Title of the story"",
            ""cover_image"": ""Image description text"",
            ""story_content"": [
              {{
                ""scene"": 1,
                ""story_text"": ""Story text"",
                ""image_description"": ""Image description text""
              }},
              {{
                ""scene"": 2,
                ""story_text"": ""Story text"",
                ""image_description"": ""Image description text""
              }}
              // Additional scenes
            ],
            ""quiz"": {{
              ""question"": ""Question text"",
              ""options"": [""Option 1"", ""Option 2"", ""Option 3"", ""Option 4""],
              ""answer"": ""Correct option""
            }}
          }}

        `;
    }

    getSystemMessage() {
        return this.systemMessage;
    }

    getUserMessageTemplate() {
        return this.userMessageTemplate;
    }

    interpolateUserMessageTemplate(MP, SE) {
        return `MP: "${MP}"\nSE: "${SE}"`;
    }

    getExampleUserMessage() {
        return {
            "User Message": "MP: What is the fraction?\nSE: The story takes place in a kitchen scenario. The main characters are a girl and a white-haired grandmother.",
            "Example Output": `
                { 
                    ""title"": ""Ava and the Magic Math Pie"",
                    ""cover_image"": ""A cheerful kitchen setting with sunlight streaming through a window. a young girl and a white-haired grandmother are standing at a kitchen table with various baking ingredients and a large mixing bowl spread out in front of them."",
                    ""story_content"": [
                    {
                        ""scene"": 1,
                        ""story_text"": ""Once upon a time in a small village, there was a girl named Ava. Ava loved to bake pies with her grandmother. One sunny afternoon, Ava and her grandmother decided to bake a magic pie that could teach math."",
                        ""image_description"": ""A cheerful kitchen setting with sunlight streaming through a window. Ava, a young girl with a bright smile, is standing next to her white-haired grandmother at a rustic kitchen table. Various baking ingredients and a large mixing bowl are spread out in front of them.""
                    },
                    {
                        ""scene"": 2,
                        ""story_text"": ""Ava's grandmother said, 'Let's make a special pie that can help you understand fractions.' They mixed the ingredients and popped the pie into the oven. Soon, a delicious aroma filled the kitchen."",
                        ""image_description"": ""Ava and her grandmother are in the kitchen, both wearing aprons and looking at a mixing bowl. Ingredients like flour, eggs, and milk are scattered around them. The oven is open in the background, ready to bake the pie.""
                    },
                    {
                        ""scene"": 3,
                        ""story_text"": ""When the pie was ready, Ava's grandmother cut it into four equal parts. 'Ava, this pie is a whole. Now, let's see what happens when we cut it into smaller pieces,' she said."",
                        ""image_description"": ""The freshly baked pie sits on the kitchen counter, with steam rising from it. Ava’s grandmother, with a knife in hand, is about to cut the pie into quarters. Ava watches intently, eager to learn.""
                    },
                    {
                        ""scene"": 4,
                        ""story_text"": ""Ava watched as her grandmother carefully cut the pie into four equal slices. 'Each piece is called a fraction of the whole pie,' her grandmother explained. She picked up one slice and said, 'This is one-fourth of the pie. We write it as 1/4.' Ava took another slice and placed it next to the first. 'Now we have two-fourths of the pie,' she said excitedly. Her grandmother nodded and wrote down 2/4. 'If we add another slice, what do we have?' her grandmother asked. Ava thought for a moment. 'Three-fourths! That’s 3/4,' she exclaimed. 'Exactly,' said her grandmother. 'And when we have all four pieces, we have 4/4, which is the whole pie again!'"",
                        ""image_description"": ""The kitchen table now displays the pie cut into four equal slices. Ava’s grandmother is pointing to one of the slices, explaining fractions. A piece of paper with the fraction ‘1/4’ written on it is also visible on the table. Ava, looking curious and excited, holds another slice.""
                    },
                    {
                        ""scene"": 5,
                        ""story_text"": ""Ava was delighted. She now understood that fractions were parts of a whole. She decided to share the pie with her friends, explaining how each slice was a fraction of the whole pie. They all enjoyed the delicious pie and learned about fractions together."",
                        ""image_description"": ""Ava is outside, sitting at a garden table with three of her friends, each with a slice of pie in front of them. Ava is animatedly explaining the concept of fractions using the slices of pie as visual aids. The children look intrigued and happy as they enjoy the pie.""
                    }
                    ],
                    ""quiz"": {
                    ""question"": ""If Ava's grandmother cuts a pie into 4 equal pieces and Ava takes one slice, what fraction of the pie does Ava have?"",
                    ""options"": [""1/4"", ""1/2"", ""3/4"", ""4/4""],
                    ""correct answer"": ""1/4""
                    }
                }
                <end of story>
            `
        }
    }
}