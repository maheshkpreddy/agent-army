import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, content, tools, model, categorySlug, tags } = body;

    if (!name || !description || !content || !categorySlug) {
      return NextResponse.json(
        { error: 'Name, description, content, and category are required' },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if skill already exists
    const existing = await db.skill.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'A skill with this name already exists' },
        { status: 409 }
      );
    }

    // Find category
    const category = await db.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Create or find tags
    const tagRecords = [];
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');
        const tag = await db.tag.upsert({
          where: { slug: tagSlug },
          update: { name: tagName },
          create: { name: tagName, slug: tagSlug },
        });
        tagRecords.push({ id: tag.id });
      }
    }

    // Create the skill
    const skill = await db.skill.create({
      data: {
        name,
        slug,
        description,
        content,
        tools: tools || null,
        model: model || null,
        userInvocable: true,
        featured: false,
        categoryId: category.id,
        tags: {
          connect: tagRecords,
        },
      },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ skill }, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
