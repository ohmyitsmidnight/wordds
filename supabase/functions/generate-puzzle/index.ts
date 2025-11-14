import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PuzzleConfig {
  user_id: string;
  difficulty: number;
  grid_size: number;
  user_words_count: number;
  include_reverse_clues?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const config: PuzzleConfig = await req.json();

    // Get user's words for the puzzle
    const { data: userWords, error: wordsError } = await supabaseClient
      .from('words')
      .select('*, word_definitions(*)')
      .eq('user_id', config.user_id)
      .eq('status', 'learning')
      .limit(config.user_words_count);

    if (wordsError) throw wordsError;

    // Select random words
    const selectedWords = userWords
      ?.sort(() => Math.random() - 0.5)
      .slice(0, config.user_words_count) || [];

    // Generate puzzle grid (simplified algorithm)
    const puzzle = await generateCrosswordGrid(
      selectedWords,
      config.grid_size,
      config.difficulty
    );

    // Get clues for each word
    const cluesAcross = await getCluesForWords(
      supabaseClient,
      puzzle.wordsAcross,
      config.difficulty,
      config.include_reverse_clues
    );

    const cluesDown = await getCluesForWords(
      supabaseClient,
      puzzle.wordsDown,
      config.difficulty,
      config.include_reverse_clues
    );

    // Save puzzle to database
    const { data: savedPuzzle, error: saveError } = await supabaseClient
      .from('puzzles')
      .insert({
        user_id: config.user_id,
        grid_size: config.grid_size,
        difficulty: config.difficulty,
        grid_data: {
          grid: puzzle.grid,
          black_squares: puzzle.blackSquares,
        },
        clues_across: cluesAcross,
        clues_down: cluesDown,
        user_words: selectedWords.map(w => w.word),
        filler_words: puzzle.fillerWords,
        generation_method: 'algorithm',
        status: 'active',
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({ puzzle: savedPuzzle }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Simplified crossword generation algorithm
async function generateCrosswordGrid(
  words: any[],
  gridSize: number,
  difficulty: number
) {
  // This is a simplified placeholder
  // Real implementation would use constraint satisfaction algorithm
  
  const grid: string[][] = Array(gridSize).fill(null).map(() => 
    Array(gridSize).fill('')
  );

  const wordsAcross: any[] = [];
  const wordsDown: any[] = [];
  const blackSquares: [number, number][] = [];
  const fillerWords: string[] = ['ERA', 'AGE', 'ART', 'ORE']; // Example filler words

  // Place words on grid (simplified)
  words.forEach((wordData, idx) => {
    const word = wordData.word.toUpperCase();
    const row = Math.floor(idx * 2) % (gridSize - word.length);
    const col = 0;
    
    // Place horizontally
    for (let i = 0; i < word.length; i++) {
      grid[row][col + i] = word[i];
    }

    wordsAcross.push({
      number: idx + 1,
      word: word,
      row,
      col,
      length: word.length,
      is_user_word: true,
    });
  });

  return {
    grid,
    wordsAcross,
    wordsDown,
    blackSquares,
    fillerWords,
  };
}

// Get clues for words
async function getCluesForWords(
  supabaseClient: any,
  words: any[],
  difficulty: number,
  includeReverse: boolean = false
) {
  const clues = [];

  for (const wordData of words) {
    // Try to get clue from database
    const { data: existingClue } = await supabaseClient
      .from('clues')
      .select('*, word_definitions(*)')
      .eq('word_definitions.word_lower', wordData.word.toLowerCase())
      .gte('difficulty_level', difficulty - 2)
      .lte('difficulty_level', difficulty + 2)
      .limit(1)
      .single();

    let clueText = existingClue?.clue_text || `Definition: ${wordData.word}`;

    // TODO: Generate AI clue if no existing clue found
    // Call OpenAI/Claude API here

    clues.push({
      number: wordData.number,
      clue: clueText,
      answer: wordData.word,
      row: wordData.row,
      col: wordData.col,
      length: wordData.length,
      is_user_word: wordData.is_user_word,
      direction: 'across', // or 'down'
    });
  }

  return clues;
}
