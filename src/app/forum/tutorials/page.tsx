'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth, AuthProvider } from '@/components/auth/auth-provider'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  Clock, 
  Eye, 
  Heart, 
  Plus, 
  Search,
  User,
  ArrowLeft
} from 'lucide-react'
import { getPublishedTutorials, type Tutorial } from '@/lib/firestore'

const CATEGORIES = [
  { id: 'all', name: 'All Tutorials', emoji: '📚' },
  { id: 'knitting', name: 'Knitting & Crochet', emoji: '🧶' },
  { id: 'painting', name: 'Painting & Art', emoji: '🎨' },
  { id: 'woodworking', name: 'Woodworking', emoji: '🪵' },
  { id: 'jewelry', name: 'Jewelry Making', emoji: '💍' },
  { id: 'sewing', name: 'Sewing & Textiles', emoji: '✂️' },
  { id: 'pottery', name: 'Pottery & Ceramics', emoji: '🏺' },
  { id: 'other', name: 'Other Crafts', emoji: '🛠️' },
]

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800', 
  advanced: 'bg-red-100 text-red-800'
}

function TutorialsPageContent() {
  const { user } = useAuth()
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTutorials()
  }, [])

  const loadTutorials = async () => {
    try {
      setLoading(true)
      const fetchedTutorials = await getPublishedTutorials()
      setTutorials(fetchedTutorials)
    } catch (error: any) {
      console.error('Error loading tutorials:', error)
      // If collection doesn't exist yet or permissions issue, just show empty state
      if (error.code === 'permission-denied' || error.code === 'not-found') {
        console.log('Tutorials collection not accessible yet - showing empty state')
        setTutorials([])
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/forum">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Curia Corner
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">📚 Tutorials & Guides</h1>
              <p className="text-slate-600">Learn new techniques from experienced makers</p>
            </div>
          </div>
          
          {user && (
            <Link href="/forum/tutorials/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Tutorial
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="mr-2">{category.emoji}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Tutorials Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading tutorials...</p>
          </div>
        ) : filteredTutorials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-4">No tutorials found</h2>
              <p className="text-slate-600 mb-8">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'Be the first to share your knowledge with the community!'
                }
              </p>
              {user && (
                <Link href="/forum/tutorials/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Tutorial
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map(tutorial => (
              <Link key={tutorial.id} href={`/forum/tutorials/${tutorial.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  {tutorial.images.length > 0 && (
                    <div className="aspect-video bg-slate-200 rounded-t-lg overflow-hidden">
                      <img
                        src={tutorial.images[0].url}
                        alt={tutorial.images[0].alt || tutorial.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{tutorial.title}</CardTitle>
                      <Badge className={DIFFICULTY_COLORS[tutorial.difficulty]}>
                        {tutorial.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {tutorial.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {tutorial.estimatedTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {tutorial.views}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {tutorial.likes}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">by</span>
                        <span className="font-medium text-slate-900">{tutorial.authorName}</span>
                        {tutorial.shopHandle && (
                          <Link 
                            href={`/shop/${tutorial.shopHandle}`}
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            @{tutorial.shopHandle}
                          </Link>
                        )}
                      </div>
                      
                      {tutorial.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tutorial.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {tutorial.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{tutorial.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TutorialsPage() {
  return (
    <AuthProvider>
      <TutorialsPageContent />
    </AuthProvider>
  )
}
