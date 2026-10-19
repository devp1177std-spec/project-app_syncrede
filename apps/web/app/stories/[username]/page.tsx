import type { Metadata } from 'next';
import { StoryViewer } from '@/components/story-viewer';

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ storyId?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}'s Story | SocialFeed`,
    description: `View stories from @${username} on SocialFeed`,
  };
}

export default async function StoryPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <StoryViewer
      initialUsername={username}
      initialStoryId={resolvedSearchParams?.storyId}
    />
  );
}
