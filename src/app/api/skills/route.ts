import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const tag = searchParams.get('tag') || '';
    const featured = searchParams.get('featured') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'name';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (tag) {
      where.tags = { some: { slug: tag } };
    }

    if (featured) {
      where.featured = true;
    }

    const orderBy: any = {};
    if (sort === 'name') orderBy.name = 'asc';
    else if (sort === 'newest') orderBy.createdAt = 'desc';
    else if (sort === 'featured') { orderBy.featured = 'desc'; orderBy.name = 'asc'; }

    const [skills, total] = await Promise.all([
      db.skill.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
          tags: { select: { id: true, name: true, slug: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.skill.count({ where }),
    ]);

    return NextResponse.json({
      skills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}
