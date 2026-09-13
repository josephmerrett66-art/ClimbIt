import type { StoryMessage } from '@/lib/game/story';
export default function StoryInbox({
  messages,
  onJobs,
}: {
  messages: StoryMessage[];
  onJobs: () => void;
}) {
  return (
    <div className="story-inbox">
      <header className="story-intro">
        <small>MONDAY · A LONG WAY DOWN</small>
        <h2>One skill. No way out but up.</h2>
        <p>
          You used to climb for a living. Now you owe $12,000 to people who
          don’t offer extensions. A battered phone and a pair of climbing hands
          are what you have left.
        </p>
      </header>
      <div className="story-thread" aria-label="Story messages">
        {messages.map((message) => (
          <article
            key={message.id}
            className={
              message.outgoing ? 'story-message outgoing' : 'story-message'
            }
          >
            <div>
              <strong>{message.from}</strong>
              <small>{message.when}</small>
            </div>
            <p>{message.text}</p>
          </article>
        ))}
      </div>
      <button className="debt-payment" onClick={onJobs}>
        FIND CLIMBING WORK
      </button>
      <p className="story-footnote">
        Friday is the deadline in the story. There’s no running clock during
        climbs.
      </p>
    </div>
  );
}
