import { create } from 'zustand';

interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string;
  content: string;
  tools: string | null;
  model: string | null;
  userInvocable: boolean;
  featured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  };
  tags: { id: string; name: string; slug: string }[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  color: string | null;
  order: number;
  _count?: { skills: number };
}

interface SkillState {
  skills: Skill[];
  categories: Category[];
  selectedSkill: Skill | null;
  selectedCategory: string;
  searchQuery: string;
  selectedTags: string[];
  sortBy: string;
  currentPage: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  view: 'grid' | 'list';
  detailOpen: boolean;
  submitOpen: boolean;

  setSkills: (skills: Skill[]) => void;
  setCategories: (categories: Category[]) => void;
  setSelectedSkill: (skill: Skill | null) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSortBy: (sort: string) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setTotal: (total: number) => void;
  setIsLoading: (loading: boolean) => void;
  setView: (view: 'grid' | 'list') => void;
  setDetailOpen: (open: boolean) => void;
  setSubmitOpen: (open: boolean) => void;
  fetchSkills: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSkillBySlug: (slug: string) => Promise<void>;
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: [],
  categories: [],
  selectedSkill: null,
  selectedCategory: '',
  searchQuery: '',
  selectedTags: [],
  sortBy: 'featured',
  currentPage: 1,
  totalPages: 1,
  total: 0,
  isLoading: false,
  view: 'grid',
  detailOpen: false,
  submitOpen: false,

  setSkills: (skills) => set({ skills }),
  setCategories: (categories) => set({ categories }),
  setSelectedSkill: (skill) => set({ selectedSkill: skill }),
  setSelectedCategory: (category) => set({ selectedCategory: category, currentPage: 1 }),
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setSelectedTags: (tags) => set({ selectedTags: tags, currentPage: 1 }),
  setSortBy: (sort) => set({ sortBy: sort, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  setTotal: (total) => set({ total }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setView: (view) => set({ view }),
  setDetailOpen: (open) => set({ detailOpen: open }),
  setSubmitOpen: (open) => set({ submitOpen: open }),

  fetchSkills: async () => {
    const { searchQuery, selectedCategory, selectedTags, sortBy, currentPage } = get();
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '24',
        sort: sortBy === 'featured' ? 'name' : sortBy,
      });
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedTags.length > 0) params.set('tag', selectedTags[0]);

      const res = await fetch(`/api/skills?${params.toString()}`);
      const data = await res.json();

      let skills = data.skills || [];

      // Client-side sort: featured first
      if (sortBy === 'featured') {
        skills = skills.sort((a: Skill, b: Skill) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.name.localeCompare(b.name);
        });
      }

      set({
        skills,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      set({ categories: data.categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  fetchSkillBySlug: async (slug: string) => {
    try {
      const res = await fetch(`/api/skills/${slug}`);
      const data = await res.json();
      if (data.skill) {
        set({ selectedSkill: data.skill, detailOpen: true });
      }
    } catch (error) {
      console.error('Error fetching skill:', error);
    }
  },
}));
