import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { 
  Calendar, 
  User, 
  Tag, 
  Search, 
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BookOpen
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author: string;
  createdAt: string;
  category: 'research' | 'outbreak' | 'treatment' | 'general';
  isPublished: boolean;
}

const News: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const fetchedNews = await apiService.getNews();
        setNewsItems(fetchedNews);
      } catch (error) {
        console.error('Failed to fetch news:', error);
        // Fallback to mock data
        setNewsItems([
          {
            id: '1',
            title: 'New Fungicide Shows Promise Against Northern Leaf Blight',
            content: 'Researchers at the Agricultural Institute have developed a new organic fungicide that shows 95% effectiveness against Northern Leaf Blight in field trials. The treatment is derived from plant extracts and is safe for the environment...',
            imageUrl: 'https://picsum.photos/seed/news1/800/400.jpg',
            author: 'Dr. Sarah Johnson',
            createdAt: '2024-01-15',
            category: 'research',
            isPublished: true,
          },
          {
            id: '2',
            title: 'Gray Leaf Spot Outbreak Reported in Midwest Regions',
            content: 'Agricultural authorities have reported an increase in Gray Leaf Spot cases across several Midwest states. Farmers are advised to monitor their crops closely and implement preventive measures...',
            imageUrl: 'https://picsum.photos/seed/news2/800/400.jpg',
            author: 'Agricultural News Team',
            createdAt: '2024-01-14',
            category: 'outbreak',
            isPublished: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const categories = [
    { id: 'all', label: 'All News', icon: BookOpen },
    { id: 'research', label: 'Research', icon: TrendingUp },
    { id: 'outbreak', label: 'Outbreaks', icon: AlertTriangle },
    { id: 'treatment', label: 'Treatment', icon: CheckCircle },
    { id: 'general', label: 'General', icon: BookOpen },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'research': return 'bg-blue-100 text-blue-800';
      case 'outbreak': return 'bg-red-100 text-red-800';
      case 'treatment': return 'bg-green-100 text-green-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'research': return TrendingUp;
      case 'outbreak': return AlertTriangle;
      case 'treatment': return CheckCircle;
      case 'general': return BookOpen;
      default: return BookOpen;
    }
  };

  const filteredNews = newsItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 h-full flex flex-col overflow-y-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">News & Updates</h1>
        <p className="text-gray-600 mt-2">
          Stay informed about the latest developments in corn disease research and treatment
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search news articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filter:</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredNews.map((item) => {
          const CategoryIcon = getCategoryIcon(item.category);
          return (
            <article key={item.id} className="card overflow-hidden">
              {item.imageUrl && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                    <CategoryIcon className="h-3 w-3" />
                    <span>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                </div>

                <h2 className="text-xl font-semibold text-gray-800 mb-3 line-clamp-2">
                  {item.title}
                </h2>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {item.content}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.author}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Read More →
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center py-12">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No articles found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-r from-primary-500 to-emerald-600 rounded-lg p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Stay Updated</h2>
        <p className="mb-6 opacity-90">
          Get the latest news and research updates delivered to your inbox
        </p>
        <div className="max-w-md mx-auto flex space-x-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Subscribe
          </button>
        </div>
      </div>
      
      {/* Add a spacer to prevent content from being hidden behind the bottom navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default News;
