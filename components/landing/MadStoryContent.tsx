"use client";

import ReactMarkdown from "react-markdown";
import { storyBlocksToMarkdown, type StoryBlock } from "./madStories";

type MadStoryContentProps = {
  blocks: StoryBlock[];
};

export function MadStoryContent({ blocks }: MadStoryContentProps) {
  const markdown = storyBlocksToMarkdown(blocks);

  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="ms-story-p">{children}</p>,
        ul: ({ children }) => <ul className="ms-story-list">{children}</ul>,
        ol: ({ children }) => <ul className="ms-story-list">{children}</ul>,
        li: ({ children }) => <li>{children}</li>,
        h2: ({ children }) => <h3 className="ms-story-h">{children}</h3>,
        h3: ({ children }) => <h3 className="ms-story-h">{children}</h3>,
        strong: ({ children }) => <strong>{children}</strong>,
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
