/* ============================================================
   QUOTES — one line at the top of Do, and nothing under it.

   A large bank, rotating every three hours so it is steady while
   you are using the app and different each time you come back to
   it. Swipe the line and you get the next one immediately.

   Chosen to be short and hard rather than warm: almost every one
   is about starting, finishing, or the cost of waiting. Anything
   you add yourself sits in the same rotation — see `mine()`.

   A note on "find more online": this app has no server, no
   dependencies and works with the aeroplane mode on. It cannot go
   and fetch quotes, and it will not invent them and put a real
   person's name underneath — a made-up attribution is a lie with a
   citation. So the bank is large, it is local, and it grows the
   honest way: you add lines you actually came across.
   ============================================================ */
window.LO = window.LO || {};

(function (LO) {
  'use strict';

  const ROTATE = 3 * 60 * 60 * 1000;      // three hours

  const QUOTES = [
    /* --- starting --- */
    ['Well begun is half done.', 'Aristotle'],
    ['The way to get started is to quit talking and begin doing.', 'Walt Disney'],
    ['Start where you are. Use what you have. Do what you can.', 'Arthur Ashe'],
    ['The best time to plant a tree was twenty years ago. The second best time is now.', 'Proverb'],
    ['A year from now you may wish you had started today.', 'Karen Lamb'],
    ['Amateurs sit and wait for inspiration. The rest of us just get up and go to work.', 'Chuck Close'],
    ['You cannot cross the sea merely by standing and staring at the water.', 'Rabindranath Tagore'],
    ['Begin, be bold, and venture to be wise.', 'Horace'],
    ['The beginning is the most important part of the work.', 'Plato'],
    ['Do not wait; the time will never be just right.', 'Napoleon Hill'],
    ['Action is the foundational key to all success.', 'Pablo Picasso'],
    ['Action is the antidote to despair.', 'Joan Baez'],
    ['Whatever you can do, or dream you can, begin it.', 'Johann Wolfgang von Goethe'],
    ['It is not enough to take steps which may some day lead to a goal; each step must be itself a goal.', 'Johann Wolfgang von Goethe'],
    ['Great things are not done by impulse, but by a series of small things brought together.', 'Vincent van Gogh'],

    /* --- the cost of waiting --- */
    ['It is not that we have a short time to live, but that we waste a lot of it.', 'Seneca'],
    ['Put off nothing until tomorrow that could be done today.', 'Seneca'],
    ['While we are postponing, life speeds by.', 'Seneca'],
    ['Nothing is more fatiguing than the eternal hanging on of an uncompleted task.', 'William James'],
    ['How we spend our days is, of course, how we spend our lives.', 'Annie Dillard'],
    ['Lost time is never found again.', 'Benjamin Franklin'],
    ['You may delay, but time will not.', 'Benjamin Franklin'],
    ['Someday is not a day of the week.', 'Proverb'],
    ['Procrastination is the thief of time.', 'Edward Young'],
    ['The trouble is, you think you have time.', 'Proverb'],

    /* --- discipline and systems --- */
    ['Discipline equals freedom.', 'Jocko Willink'],
    ['You do not rise to the level of your goals. You fall to the level of your systems.', 'James Clear'],
    ['What gets measured gets managed.', 'Peter Drucker'],
    ['We are what we repeatedly do. Excellence, then, is not an act but a habit.', 'Will Durant'],
    ['The chains of habit are too light to be felt until they are too heavy to be broken.', 'Samuel Johnson'],
    ['Motivation is what gets you started. Habit is what keeps you going.', 'Jim Ryun'],
    ['Small disciplines repeated with consistency every day lead to great achievements.', 'John Maxwell'],
    ['Energy and persistence conquer all things.', 'Benjamin Franklin'],
    ['Perseverance is not a long race; it is many short races one after the other.', 'Walter Elliot'],
    ['It does not matter how slowly you go so long as you do not stop.', 'Confucius'],
    ['Little by little, one travels far.', 'Proverb'],
    ['Fall seven times, stand up eight.', 'Japanese proverb'],
    ['Rivers know this: there is no hurry. We shall get there some day.', 'A. A. Milne'],
    ['Order and simplification are the first steps toward the mastery of a subject.', 'Thomas Mann'],
    ['Simplicity is the ultimate sophistication.', 'Leonardo da Vinci'],

    /* --- the stoics, mostly on getting on with it --- */
    ['The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius'],
    ['Waste no more time arguing what a good man should be. Be one.', 'Marcus Aurelius'],
    ['You have power over your mind, not outside events. Realise this, and you will find strength.', 'Marcus Aurelius'],
    ['Never let the future disturb you. You will meet it with the same weapons of reason.', 'Marcus Aurelius'],
    ['Confine yourself to the present.', 'Marcus Aurelius'],
    ['If it is not right, do not do it. If it is not true, do not say it.', 'Marcus Aurelius'],
    ['First say to yourself what you would be, then do what you have to do.', 'Epictetus'],
    ['No man is free who is not master of himself.', 'Epictetus'],
    ['It is not what happens to you, but how you react to it that matters.', 'Epictetus'],
    ['Difficulties strengthen the mind, as labour does the body.', 'Seneca'],
    ['We suffer more often in imagination than in reality.', 'Seneca'],
    ['Luck is what happens when preparation meets opportunity.', 'Seneca'],
    ['Every new beginning comes from some other beginning’s end.', 'Seneca'],

    /* --- doing hard things --- */
    ['Courage is being scared to death and saddling up anyway.', 'John Wayne'],
    ['He who has a why to live can bear almost any how.', 'Friedrich Nietzsche'],
    ['That which does not kill us makes us stronger.', 'Friedrich Nietzsche'],
    ['The only way out is through.', 'Robert Frost'],
    ['If you are going through hell, keep going.', 'Proverb'],
    ['Hard choices, easy life. Easy choices, hard life.', 'Jerzy Gregorek'],
    ['Do the hard jobs first. The easy jobs will take care of themselves.', 'Dale Carnegie'],
    ['Nothing in the world is worth having or worth doing unless it means effort, pain, difficulty.', 'Theodore Roosevelt'],
    ['Do what you can, with what you have, where you are.', 'Theodore Roosevelt'],
    ['I have not failed. I have just found ten thousand ways that will not work.', 'Thomas Edison'],
    ['Opportunity is missed by most people because it is dressed in overalls and looks like work.', 'Thomas Edison'],
    ['Genius is one percent inspiration and ninety-nine percent perspiration.', 'Thomas Edison'],
    ['The man who moves a mountain begins by carrying away small stones.', 'Confucius'],
    ['Our greatest glory is not in never falling, but in rising every time we fall.', 'Confucius'],

    /* --- attention and clarity --- */
    ['The successful warrior is the average man, with laser-like focus.', 'Bruce Lee'],
    ['It is not daily increase but daily decrease. Hack away at the unessential.', 'Bruce Lee'],
    ['Beware the barrenness of a busy life.', 'Socrates'],
    ['The unexamined life is not worth living.', 'Socrates'],
    ['Know thyself.', 'Inscription at Delphi'],
    ['He who knows others is wise; he who knows himself is enlightened.', 'Lao Tzu'],
    ['A journey of a thousand miles begins with a single step.', 'Lao Tzu'],
    ['Nature does not hurry, yet everything is accomplished.', 'Lao Tzu'],
    ['When I let go of what I am, I become what I might be.', 'Lao Tzu'],
    ['Clarity about what matters provides clarity about what does not.', 'Cal Newport'],
    ['If you chase two rabbits, you will catch neither.', 'Proverb'],
    ['The main thing is to keep the main thing the main thing.', 'Stephen Covey'],
    ['Things which matter most must never be at the mercy of things which matter least.', 'Johann Wolfgang von Goethe'],

    /* --- the body, the bike, the road --- */
    ['Ride as much or as little as you feel. But ride.', 'Eddy Merckx'],
    ['It never gets easier, you just go faster.', 'Greg LeMond'],
    ['Four wheels move the body. Two wheels move the soul.', 'Proverb'],
    ['The best rides are the ones where you bite off much more than you can chew, and live through it.', 'Doug Bradbury'],
    ['Nothing compares to the simple pleasure of riding a bike.', 'John F. Kennedy'],
    ['Take care of your body. It is the only place you have to live.', 'Jim Rohn'],
    ['A man’s health can be judged by which he takes two at a time — pills or stairs.', 'Joan Welsh'],
    ['Movement is a medicine for creating change in a person’s physical, emotional and mental states.', 'Carol Welch'],
    ['If you do not find time for exercise, you will have to find time for illness.', 'Proverb'],
    ['An early-morning walk is a blessing for the whole day.', 'Henry David Thoreau'],

    /* --- making things --- */
    ['The secret of getting ahead is getting started.', 'Mark Twain'],
    ['Continuous improvement is better than delayed perfection.', 'Mark Twain'],
    ['Perfection is the enemy of good.', 'Voltaire'],
    ['Done is better than perfect.', 'Proverb'],
    ['A good plan violently executed now is better than a perfect plan next week.', 'George S. Patton'],
    ['Inspiration exists, but it has to find you working.', 'Pablo Picasso'],
    ['You cannot use up creativity. The more you use, the more you have.', 'Maya Angelou'],
    ['Nothing will work unless you do.', 'Maya Angelou'],
    ['If you want to build a ship, teach people to long for the endless immensity of the sea.', 'Antoine de Saint-Exupéry'],
    ['A goal without a plan is just a wish.', 'Antoine de Saint-Exupéry'],
    ['Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.', 'Antoine de Saint-Exupéry'],
    ['Quality is not an act, it is a habit.', 'Aristotle'],
    ['Make each day your masterpiece.', 'John Wooden'],
    ['Do not let what you cannot do interfere with what you can do.', 'John Wooden'],
    ['Little things make big things happen.', 'John Wooden'],

    /* --- other people --- */
    ['No one is useless in this world who lightens the burden of another.', 'Charles Dickens'],
    ['We are all in this together, by ourselves.', 'Lily Tomlin'],
    ['The best way to find yourself is to lose yourself in the service of others.', 'Mahatma Gandhi'],
    ['Be the change you wish to see in the world.', 'Mahatma Gandhi'],
    ['If you want to go fast, go alone. If you want to go far, go together.', 'Proverb'],
    ['Nobody can go back and start a new beginning, but anyone can start today and make a new ending.', 'Maria Robinson'],

    /* --- the long view --- */
    ['We overestimate what we can do in a day and underestimate what we can do in a year.', 'Proverb'],
    ['The days are long but the decades are short.', 'Sam Altman'],
    ['Life is what happens while you are busy making other plans.', 'Allen Saunders'],
    ['Do not judge each day by the harvest you reap but by the seeds that you plant.', 'Robert Louis Stevenson'],
    ['The future depends on what you do today.', 'Mahatma Gandhi'],
    ['Tomorrow is the first blank page of a book of three hundred and sixty-five pages.', 'Brad Paisley'],
    ['You will never change your life until you change something you do daily.', 'John Maxwell'],
    ['Twenty years from now you will be more disappointed by the things you did not do.', 'H. Jackson Brown Jr.'],
    ['Let each day be the scholar of yesterday.', 'Publilius Syrus'],
    ['A day is a miniature of eternity.', 'Ralph Waldo Emerson'],
    ['What lies behind us and what lies before us are tiny matters compared to what lies within us.', 'Henry Stanley Haskins'],
    ['Finish each day and be done with it. You have done what you could.', 'Ralph Waldo Emerson'],
    ['Write it on your heart that every day is the best day in the year.', 'Ralph Waldo Emerson'],
    ['Do not go where the path may lead; go instead where there is no path and leave a trail.', 'Ralph Waldo Emerson']
  ];

  /** lines he has kept himself, in the same rotation as the bank */
  function mine() {
    const s = LO.store && LO.store.state;
    const own = (s && s.scribe && s.scribe.quotes) || [];
    return own.map(q => [q.text, q.who || 'Kept by you']);
  }

  function bank() { return QUOTES.concat(mine()); }

  /** which slot of the rotation we are in — three hours wide */
  function slot() {
    const nudge = (LO.store && LO.store.state.meta && LO.store.state.meta.quoteNudge) || 0;
    return Math.floor(Date.now() / ROTATE) + nudge;
  }

  /* A prime-ish stride means consecutive slots land far apart in the bank,
     so three hours later you get something unrelated rather than the next
     line down the list. */
  function today() {
    const all = bank();
    const q = all[(slot() * 37) % all.length];
    return { text: q[0], who: q[1] };
  }

  /** swipe: move the rotation on now, and keep the new one for this slot */
  function next() {
    const m = LO.store.state.meta;
    m.quoteNudge = (m.quoteNudge || 0) + 1;
    LO.store.save();
    return today();
  }

  /** keep a line of your own; it joins the rotation immediately */
  function keep(text, who) {
    const s = LO.store.state;
    s.scribe.quotes = s.scribe.quotes || [];
    s.scribe.quotes.unshift({
      id: LO.store.id('q'), text: String(text).trim(),
      who: (who || '').trim(), date: LO.D.today()
    });
    LO.store.save();
  }

  LO.quotes = { QUOTES, bank, today, next, keep, mine, ROTATE };
})(window.LO);
