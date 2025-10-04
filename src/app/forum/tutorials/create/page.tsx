'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth, AuthProvider } from '@/components/auth/auth-provider'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  Save, 
  Eye,
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react'
import { createTutorial, getUserProfile, getUserShop } from '@/lib/firestore'
import type { Tutorial } from '@/lib/firestore'

const CATEGORIES = [
  { id: 'knitting', name: 'Knitting & Crochet', emoji: '🧶' },
  { id: 'painting', name: 'Painting & Art', emoji: '🎨' },
  { id: 'woodworking', name: 'Woodworking', emoji: '🪵' },
  { id: 'jewelry', name: 'Jewelry Making', emoji: '💍' },
  { id: 'sewing', name: 'Sewing & Textiles', emoji: '✂️' },
  { id: 'pottery', name: 'Pottery & Ceramics', emoji: '🏺' },
  { id: 'other', name: 'Other Crafts', emoji: '🛠️' },
]

const DIFFICULTIES = [
  { id: 'beginner', name: 'Beginner', description: 'Perfect for first-timers', color: 'bg-green-100 text-green-800' },
  { id: 'intermediate', name: 'Intermediate', description: 'Some experience needed', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'advanced', name: 'Advanced', description: 'For experienced makers', color: 'bg-red-100 text-red-800' },
]

function CreateTutorialPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    difficulty: '' as 'beginner' | 'intermediate' | 'advanced' | '',
    estimatedTime: '',
    materials: [] as string[],
    tools: [] as string[],
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published'
  })
  
  const [images, setImages] = useState<File[]>([])
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [newMaterial, setNewMaterial] = useState('')
  const [newTool, setNewTool] = useState('')
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userShop, setUserShop] = useState<any>(null)

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return
    
    if (!user) {
      router.push('/auth/signin?redirect=' + encodeURIComponent('/forum/tutorials/create'))
      return
    }
    
    loadUserData()
  }, [user, authLoading, router])

  const loadUserData = async () => {
    if (!user) return
    
    try {
      const [profile, shop] = await Promise.all([
        getUserProfile(user.uid),
        getUserShop(user.uid)
      ])
      
      setUserProfile(profile)
      setUserShop(shop)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 5 images
    const newImages = [...images, ...files].slice(0, 5)
    setImages(newImages)

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreview(prev => [...prev, ...newPreviews].slice(0, 5))
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreview(prev => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const addItem = (type: 'materials' | 'tools' | 'tags', value: string) => {
    if (!value.trim()) return
    
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }))
    
    // Clear the input
    if (type === 'materials') setNewMaterial('')
    if (type === 'tools') setNewTool('')
    if (type === 'tags') setNewTag('')
  }

  const removeItem = (type: 'materials' | 'tools' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!user || !userProfile) return

    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }
      if (!formData.content.trim()) {
        throw new Error('Content is required')
      }
      if (!formData.category) {
        throw new Error('Category is required')
      }
      if (!formData.difficulty) {
        throw new Error('Difficulty level is required')
      }

      // Temporarily skip images to avoid Firestore size limits
      // TODO: Implement proper image upload to cloud storage
      const imageData: { id: string; url: string; alt?: string; order: number }[] = []

      const tutorialData: Omit<Tutorial, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views'> = {
        authorId: user.uid,
        authorName: userProfile.name || user.email || 'Anonymous',
        shopId: userShop?.id,
        shopHandle: userShop?.handle,
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        difficulty: formData.difficulty as 'beginner' | 'intermediate' | 'advanced',
        estimatedTime: formData.estimatedTime.trim() || 'Not specified',
        materials: formData.materials,
        tools: formData.tools,
        images: imageData,
        status
      }

      const tutorial = await createTutorial(tutorialData)
      
      // Redirect to the new tutorial
      router.push(`/forum/tutorials/${tutorial.id}`)
    } catch (err: any) {
      console.error('Error creating tutorial:', err)
      setError(err.message || 'Failed to create tutorial')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <Navigation user={null} />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/forum/tutorials">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tutorials
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Create Tutorial</h1>
            <p className="text-slate-600">Share your knowledge with the maker community</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about your tutorial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tutorial Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., How to Knit a Cozy Winter Scarf"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description *</Label>
                <Textarea
                  id="description"
                  placeholder="A brief overview of what readers will learn..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className="mr-2">{category.emoji}</span>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level *</Label>
                  <Select value={formData.difficulty} onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map(diff => (
                        <SelectItem key={diff.id} value={diff.id}>
                          <div className="flex items-center gap-2">
                            <Badge className={diff.color}>{diff.name}</Badge>
                            <span className="text-sm text-slate-600">{diff.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Estimated Time</Label>
                  <Input
                    id="time"
                    placeholder="e.g., 2 hours, 1 day"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
            {/* Temporarily disabled - TODO: Implement proper image upload */}
            {false && <Card>
              <CardHeader>
                <CardTitle>Tutorial Images</CardTitle>
                <CardDescription>Add photos to illustrate your tutorial (up to 5 images)</CardDescription>
              </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50">
                      <Upload className="h-4 w-4" />
                      Upload Images
                    </div>
                  </Label>
                  <span className="text-sm text-slate-600">{images.length}/5 images</span>
                </div>

                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>}

          {/* Tutorial Content */}
          <Card>
            <CardHeader>
              <CardTitle>Tutorial Content *</CardTitle>
              <CardDescription>Write your step-by-step tutorial</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your detailed tutorial here... Include step-by-step instructions, tips, and any important notes."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={15}
                className="font-mono"
              />
            </CardContent>
          </Card>

          {/* Materials and Tools */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Materials Needed</CardTitle>
                <CardDescription>List all materials required for this tutorial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add material..."
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('materials', newMaterial)}
                  />
                  <Button onClick={() => addItem('materials', newMaterial)} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.materials.map((material, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {material}
                      <button onClick={() => removeItem('materials', index)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tools Required</CardTitle>
                <CardDescription>List all tools needed for this tutorial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tool..."
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem('tools', newTool)}
                  />
                  <Button onClick={() => addItem('tools', newTool)} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tools.map((tool, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {tool}
                      <button onClick={() => removeItem('tools', index)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add tags to help people find your tutorial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('tags', newTag)}
                />
                <Button onClick={() => addItem('tags', newTag)} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="gap-1">
                    #{tag}
                    <button onClick={() => removeItem('tags', index)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 pb-8">
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit('published')}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Publish Tutorial
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreateTutorialPageWrapper() {
  return (
    <AuthProvider>
      <CreateTutorialPage />
    </AuthProvider>
  )
}
