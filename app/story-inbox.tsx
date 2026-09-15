'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { messageThreads, type StoryMessage } from '@/lib/game/story';

export default function StoryInbox({
  messages,
  readIds,
  onRead,
  onJobs,
}: {
  messages: StoryMessage[];
  readIds: string[];
  onRead: (ids: string[]) => void;
  onJobs: () => void;
}) {
  const [person, setPerson] = useState<string | null>(null);
  const threads = messageThreads(messages);
  const active = threads.find((thread) => thread.person === person);
  const unread =
    active?.messages
      .filter((message) => !readIds.includes(message.id))
      .map((message) => message.id)
      .join('|') ?? '';
  useEffect(() => {
    if (unread) onRead(unread.split('|'));
  }, [unread, onRead]);
  if (active)
    return (
      <div className="story-inbox conversation">
        <header className="conversation-header">
          <button
            onClick={() => setPerson(null)}
            aria-label="Back to conversations"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <strong>{active.person}</strong>
            <small>Messages</small>
          </div>
        </header>
        <div
          className="story-thread"
          aria-label={`Conversation with ${active.person}`}
        >
          {active.messages.map((message) => (
            <article
              key={message.id}
              className={
                message.outgoing ? 'story-message outgoing' : 'story-message'
              }
            >
              <small>
                {message.outgoing ? 'You · ' : ''}
                {message.when}
              </small>
              <p>{message.text}</p>
            </article>
          ))}
        </div>
        {active.person === 'Odd Jobs' && (
          <button className="debt-payment" onClick={onJobs}>
            FIND CLIMBING WORK
          </button>
        )}
      </div>
    );
  return (
    <div className="story-inbox">
      <header className="story-intro">
        <small>YOUR INBOX</small>
        <h2>Messages</h2>
      </header>
      <div className="conversation-list" aria-label="Conversations">
        {threads.map((thread) => {
          const last = thread.messages[thread.messages.length - 1];
          const count = thread.messages.filter(
            (message) => !message.outgoing && !readIds.includes(message.id),
          ).length;
          return (
            <button
              key={thread.person}
              className="conversation-row"
              onClick={() => setPerson(thread.person)}
            >
              <span className="contact-avatar" aria-hidden="true">
                {thread.person === 'Unknown number'
                  ? '?'
                  : thread.person
                      .split(' ')
                      .map((word) => word[0])
                      .join('')}
              </span>
              <span className="conversation-preview">
                <strong>{thread.person}</strong>
                <small>{last.when}</small>
                <span>
                  {last.outgoing ? 'You: ' : ''}
                  {last.text}
                </span>
              </span>
              {count > 0 ? (
                <span
                  className="conversation-unread"
                  aria-label={`${count} unread messages`}
                >
                  {count}
                </span>
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          );
        })}
      </div>
      <p className="story-footnote">
        An old climbing career. $12,000 owed. Friday to find a way out.
      </p>
      <button className="debt-payment" onClick={onJobs}>
        FIND CLIMBING WORK
      </button>
    </div>
  );
}
