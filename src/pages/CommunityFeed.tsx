import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Image as ImageIcon, 
  MoreHorizontal,
  ThumbsUp,
  User,
  Calendar,
  Leaf,
  Search,
  Filter
} from 'lucide-react';
import api from '../services/api';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  images?: string[];
  likes: number;
  comments: Comment[];
  createdAt: string;
  isLiked?: boolean;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

const CommunityFeed: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'disease' | 'treatment' | 'general'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'mostComments'>('latest');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.getPosts();
        console.log('API Response:', response);
        
        // Handle different response formats
        const fetchedPosts = Array.isArray(response) 
          ? response 
          : response?.data || response?.posts || [];
            
        console.log('Processed posts:', fetchedPosts);
        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        // Fallback to mock data
        const mockPosts = [
          {
            id: '1',
            userId: '1',
            userName: 'John Farmer',
            userAvatar: '',
            content: 'Just detected Northern Leaf Blight in my corn field. Started treatment immediately. Has anyone used organic fungicides with good results?',
            images: ['https://picsum.photos/seed/corn1/400/300.jpg'],
            likes: 12,
            comments: [
              {
                id: 'c1',
                userId: '2',
                userName: 'Mary Agriculture',
                userAvatar: '',
                content: 'I\'ve had success with neem oil spray. It\'s natural and effective for early stages.',
                createdAt: '2 hours ago',
              },
            ],
            createdAt: '3 hours ago',
            isLiked: false,
          },
          {
            id: '2',
            userId: '2',
            userName: 'Mary Agriculture',
            userAvatar: '',
            content: 'Great news! The treatment for Gray Leaf Spot worked perfectly. My corn is recovering well. Remember to act quickly when you first spot symptoms!',
            likes: 28,
            comments: [
              {
                id: 'c2',
                userId: '3',
                userName: 'Bob Fields',
                userAvatar: '',
                content: 'What treatment did you use? I\'m dealing with the same issue.',
                createdAt: '1 hour ago',
              },
            ],
            createdAt: '5 hours ago',
            isLiked: true,
          },
          {
            id: '3',
            userId: '3',
            userName: 'Bob Fields',
            userAvatar: '',
            content: 'Pro tip: Early morning is the best time to inspect your corn leaves. The dew makes disease symptoms more visible. This helped me catch Common Rust before it spread!',
            likes: 15,
            comments: [],
            createdAt: '1 day ago',
            isLiked: false,
          },
        ];
        setPosts(mockPosts);
        setFilteredPosts(mockPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Apply search and filters
  useEffect(() => {
    let filtered = [...posts];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filter type
    if (filterType !== 'all') {
      filtered = filtered.filter(post => {
        const content = post.content.toLowerCase();
        switch (filterType) {
          case 'disease':
            return content.includes('disease') || content.includes('blight') || content.includes('rust') || content.includes('spot');
          case 'treatment':
            return content.includes('treatment') || content.includes('fungicide') || content.includes('spray') || content.includes('medicine');
          case 'general':
            return !content.includes('disease') && !content.includes('treatment') && !content.includes('fungicide');
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'popular':
          return b.likes - a.likes;
        case 'mostComments':
          return b.comments.length - a.comments.length;
        default:
          return 0;
      }
    });

    setFilteredPosts(filtered);
  }, [posts, searchTerm, filterType, sortBy]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    try {
      const title = newPostContent.split(' ').slice(0, 5).join(' ') + '...';
      const image = selectedImages.length > 0 ? selectedImages[0] : undefined;
      const response = await api.createPost(title, newPostContent, image);
      
      // Handle different response formats
      const newPost = response?.data || response || {
        id: Date.now().toString(),
        userId: user?.id || '1',
        userName: user?.name || 'Current User',
        userAvatar: user?.avatar || '',
        content: newPostContent,
        images: selectedImages.length > 0 ? [URL.createObjectURL(selectedImages[0])] : [],
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString(),
        isLiked: false
      };
      
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setSelectedImages([]);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await api.likePost(postId);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1, isLiked: !post.isLiked }
          : post
      ));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleComment = (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: user?.id || 'current',
      userName: user?.name || 'Current User',
      userAvatar: '',
      content: commentText,
      createdAt: 'Just now',
    };

    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, comments: [...post.comments, newComment] }
        : post
    ));

    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatTime = (time: string) => {
    const date = new Date(time);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          
          {/* Filter and Sort Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="all">All Posts</option>
                <option value="disease">Disease Related</option>
                <option value="treatment">Treatment & Tips</option>
                <option value="general">General Discussion</option>
              </select>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="latest">Latest First</option>
              <option value="popular">Most Popular</option>
              <option value="mostComments">Most Discussed</option>
            </select>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredPosts.length} of {posts.length} posts
        </div>
      </div>

      {/* Create Post Section - Facebook Style */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-gray-100 rounded-full px-4 py-2.5 cursor-pointer hover:bg-gray-200 transition-colors"
                 onClick={() => document.getElementById('post-input')?.focus()}>
              <span className="text-gray-600 text-sm">What's on your mind about your crops?</span>
            </div>
            <textarea
              id="post-input"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder=""
              className="hidden w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
            
            {/* Post Options - Hidden by default */}
            <div className={`${newPostContent ? 'flex' : 'hidden'} items-center justify-between mt-3 pt-3 border-t border-gray-200`}>
              <div className="flex space-x-4">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm">Photo</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
                  <Leaf className="h-5 w-5" />
                  <span className="text-sm">Disease</span>
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className="bg-primary-600 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post: Post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Post Header */}
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{post.userName}</h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatTime(post.createdAt)}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Leaf className="h-3 w-3 mr-1" />
                          Farmer
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-gray-800 text-sm leading-relaxed">{post.content}</p>
              </div>

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className="px-4 pb-3">
                  <div className="grid gap-2">
                    {post.images.map((image: string, index: number) => (
                      <div key={index} className="relative">
                        <img 
                          src={image} 
                          alt={`Post image ${index + 1}`}
                          className="w-full rounded-lg object-cover max-h-96"
                        />
                        {post.content.toLowerCase().includes('disease') && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Disease Alert
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="px-4 py-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                        post.isLiked 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{post.likes}</span>
                    </button>
                    <button 
                      onClick={() => handleComment(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{post.comments.length}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Share</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              {post.comments.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="space-y-3">
                    {post.comments.slice(0, 2).map((comment: Comment) => (
                      <div key={comment.id} className="flex space-x-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-3 py-2 flex-1">
                          <p className="font-medium text-sm text-gray-900">{comment.userName}</p>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{comment.createdAt}</p>
                        </div>
                      </div>
                    ))}
                    {post.comments.length > 2 && (
                      <button className="text-primary-600 text-sm font-medium hover:text-primary-700">
                        View all {post.comments.length} comments
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Add Comment */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-1.5">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      placeholder="Write a comment..."
                      className="flex-1 bg-transparent text-sm outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          handleComment(post.id);
                          setCommentInputs({ ...commentInputs, [post.id]: '' });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No posts found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityFeed;
