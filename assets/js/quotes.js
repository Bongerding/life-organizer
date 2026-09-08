/* ============================================================
   QUOTES — one line at the top of Do, and nothing under it.

   Twenty-five, rotating by the day so it is steady while you are
   using it and different when you come back. Chosen to be short
   and hard rather than warm: every one of them is about starting,
   finishing, or the cost of waiting.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const QUOTES = [
    ['Well begun is half done.', 'Aristotle'],
    ['The impediment to action advances action.', 'Marcus Aurelius'],
    ['Discipline equals freedom.', 'Jocko Willink'],
    ['Amateurs sit and wait for inspiration. The rest of us just get up and go to work.', 'Chuck Close'],
    ['You do not rise to the level of your goals. You fall to the level of your systems.', 'James Clear'],
    ['Action is the antidote to despair.', 'Joan Baez'],
    ['It is not that we have a short time to live, but that we waste a lot of it.', 'Seneca'],
    ['Start where you are. Use what you have. Do what you can.', 'Arthur Ashe'],
    ['The second best time is now.', 'Proverb'],
    ['Nothing is more fatiguing than the eternal hanging on of an uncompleted task.', 'William James'],
    ['A year from now you may wish you had started today.', 'Karen Lamb'],
    ['Fall seven times, stand up eight.', 'Japanese proverb'],
    ['What gets measured gets managed.', 'Peter Drucker'],
    ['The way to get started is to quit talking and begin doing.', 'Walt Disney'],
    ['Ride as much or as little as you feel. But ride.', 'Eddy Merckx'],
    ['It never gets easier, you just go faster.', 'Greg LeMond'],
    ['Four wheels move the body. Two wheels move the soul.', 'Proverb'],
    ['Simplicity is the ultimate sophistication.', 'Leonardo da Vinci'],
    ['He who has a why can bear almost any how.', 'Friedrich Nietzsche'],
    ['Waste no more time arguing what a good man should be. Be one.', 'Marcus Aurelius'],
    ['Energy and persistence conquer all things.', 'Benjamin Franklin'],
    ['You cannot cross the sea merely by standing and staring at the water.', 'Rabindranath Tagore'],
    ['First say to yourself what you would be, then do what you have to do.', 'Epictetus'],
    ['The chains of habit are too light to be felt until they are too heavy to be broken.', 'Samuel Johnson'],
    ['Courage is being scared to death and saddling up anyway.', 'John Wayne']
  ];

  /** stable for the whole day, different tomorrow, cycling through all 25 */
  function today() {
    const day = Math.floor(Date.now() / 86400000);
    const q = QUOTES[day % QUOTES.length];
    return { text: q[0], who: q[1] };
  }

  LO.quotes = { QUOTES, today };
})(window.LO);
