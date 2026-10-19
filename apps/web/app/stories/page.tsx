import type { Metadata } from 'next';
import { StoryViewer } from '@/components/story-viewer';

interface PageProps {
  searchParams?: Promise<{ user?: string; storyId?: string }>;
}

export const metadata: Metadata = {
  title: 'Stories | SocialFeed',
  description: 'View user stories on SocialFeed',
};

export default async function StoriesIndexPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <StoryViewer
      initialUsername={resolvedSearchParams?.user}
      initialStoryId={resolvedSearchParams?.storyId}
    />
  );
}
