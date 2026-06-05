import { User } from 'lucide-react';

export interface Author {
    id: string;
    name: string;
    avatarUrl?: string; // Optional, fallback to icon
    title: string;
    isVerified?: boolean;
    bannerUrl?: string; // For profile preview
    mutualCommunities?: string[]; // IDs or Names
}

export interface Community {
    id: string;
    name: string;
    icon: string;
}

export interface Post {
    id: string;
    author: Author;
    community?: Community; // Linked community
    title?: string; // New: Reddit style title
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    shares: number;
    type: 'post' | 'job_ad' | 'webinar_ad';
    tags?: string[];
    imageUrl?: string;
    isLiked?: boolean;
    // Ad specific fields
    ctaLabel?: string;
    ctaLink?: string;
}

export const MOCK_POSTS: Post[] = [
    {
        id: '1',
        author: {
            id: 'u1',
            name: 'Sarah Chen',
            title: 'Product Designer at TechFlow',
            isVerified: true,
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
            bannerUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=200&fit=crop',
            mutualCommunities: ['UX Design Masters', 'Frontend Connect']
        },
        community: { id: 'c1', name: 'UX/UI Design', icon: '🎨' },
        title: "How much does Accessibility actually impact retention?",
        content: "I've been running some A/B tests on our main landing page. Changing the contrast ratio on our CTA buttons increased click-throughs by 15%. It's fascinating how small changes impact user behavior. \n\nHas anyone else seen similar results?",
        timestamp: '2 hours ago',
        likes: 124,
        comments: 42,
        shares: 12,
        type: 'post',
        imageUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d48?w=800&q=80'
    },
    {
        id: 'ad1',
        author: {
            id: 'u_comp',
            name: 'Google',
            title: 'Technology Company',
            isVerified: true,
            avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png'
        },
        title: "Senior Product Manager - Cloud Infrastructure",
        content: "Join our team and help build the future of cloud computing. We are looking for experienced PMs to lead our infrastructure initiatives.",
        timestamp: 'Promoted',
        likes: 45,
        comments: 2,
        shares: 5,
        type: 'job_ad',
        ctaLabel: 'Apply Now',
        ctaLink: '#'
    },
    {
        id: '2',
        author: {
            id: 'u2',
            name: 'David Miller',
            title: 'Senior Frontend Dev',
            isVerified: false,
            bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=200&fit=crop'
        },
        community: { id: 'c2', name: 'React Developers', icon: '⚛️' },
        title: "Anyone heading to ReactConf next month?",
        content: "I'll be giving a lightning talk on state management patterns. Would love to meet up with folks from this community! Let's connect! ⚡️",
        timestamp: '5 hours ago',
        likes: 89,
        comments: 15,
        shares: 3,
        type: 'post'
    },
    {
        id: 'ad2',
        author: {
            id: 'u_uni',
            name: 'Unimad Academy',
            title: 'Education Platform',
            isVerified: true
        },
        title: "Webinar: Mastering System Design Interviews",
        content: "Learn the secrets to aceing your system design rounds at top tech companies. Hosted by ex-FAANG engineers.",
        timestamp: 'Promoted',
        likes: 230,
        comments: 12,
        shares: 44,
        type: 'webinar_ad',
        imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
        ctaLabel: 'Register for Free',
        ctaLink: '#'
    }
];

export const MY_COMMUNITIES = [
    { id: 'c1', name: 'UX/UI Design', icon: '🎨', isNew: true },
    { id: 'c2', name: 'React Developers', icon: '⚛️' },
    { id: 'c3', name: 'Product Management', icon: '📊' },
    { id: 'c4', name: 'Career Advice', icon: '🚀' },
];

export const SUGGESTED_GROUPS = [
    { id: 'g1', name: 'Remote Workers', members: '45k members', image: '🌍' },
    { id: 'g2', name: 'Software Engineering', members: '82k members', image: '💻' }
];
