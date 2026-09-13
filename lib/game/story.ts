export type StoryMessage = {
  id: string;
  from: string;
  when: string;
  text: string;
  outgoing?: boolean;
};
export function storyMessages(finances: {
  debt: number;
  completedJobs: string[];
  lifetimeEarnings: number;
}): StoryMessage[] {
  const count = new Set(finances.completedJobs).size;
  const messages: StoryMessage[] = [
    {
      id: 'demand',
      from: 'Unknown number',
      when: 'MONDAY · 7:06 AM',
      text: 'Twelve grand. Friday. Don’t make us come looking.',
    },
    {
      id: 'reply',
      from: 'You',
      when: '7:08 AM',
      text: 'I said I’d pay. I’m finding work.',
      outgoing: true,
    },
    {
      id: 'terms',
      from: 'Unknown number',
      when: '7:09 AM',
      text: 'Then find it. Send what you can. We’re keeping count.',
    },
    {
      id: 'first-job',
      from: 'Odd Jobs',
      when: 'NEARBY WORK',
      text: 'Climber wanted at The Galah Arms. Ute keys on the roof. $180 on completion. No references required.',
    },
  ];
  if (count >= 1)
    messages.push({
      id: 'first-clear',
      from: 'Mara',
      when: 'AFTER YOUR FIRST JOB',
      text: 'Saw your profile on Odd Jobs. I remember when you were climbing for a living. You alright?',
    });
  if (count >= 3)
    messages.push({
      id: 'three-jobs',
      from: 'Unknown number',
      when: 'THREE JOBS LATER',
      text: 'Heard you’re working again. Good. Working isn’t the same as paying.',
    });
  if (count >= 5)
    messages.push({
      id: 'five-jobs',
      from: 'Mara',
      when: 'FIVE JOBS LATER',
      text: 'You stopped answering after the last expedition. Now you’re on roofs for strangers. You can call me. It doesn’t have to be about climbing.',
    });
  if (finances.debt < 12000)
    messages.push({
      id: 'first-payment',
      from: 'Unknown number',
      when: 'FIRST PAYMENT RECEIVED',
      text: 'Got it. Keep going. Friday hasn’t moved.',
    });
  if (finances.debt <= 6000)
    messages.push({
      id: 'half-paid',
      from: 'Mara',
      when: 'HALFWAY OUT',
      text: 'Half paid. That’s something. Just don’t take a fall trying to make the next payment.',
    });
  if (finances.debt === 0)
    messages.push(
      {
        id: 'debt-clear',
        from: 'Unknown number',
        when: 'BALANCE SETTLED',
        text: 'We’re square. Lose this number.',
      },
      {
        id: 'new-start',
        from: 'Mara',
        when: 'A LITTLE LATER',
        text: 'Come climbing with me sometime. No job. No money. Just a climb.',
      },
    );
  return messages;
}

export function debtPayment(
  balance: number,
  debt: number,
  input: string,
): number {
  const amount = input === '' ? balance : Number(input);
  return Number.isFinite(amount)
    ? Math.max(0, Math.min(balance, debt, Math.floor(amount)))
    : 0;
}
