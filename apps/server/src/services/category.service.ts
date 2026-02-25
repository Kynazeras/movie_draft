import { prisma } from '@movie-draft/prisma-client';
import { CreateCategoryInput, UpdateCategoryInput } from '@movie-draft/shared';

export interface CategoryDetail {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  roomId: string;
  _count: {
    picks: number;
  };
}

export async function createCategory(
  roomId: string,
  data: CreateCategoryInput,
): Promise<CategoryDetail> {
  let order = data.order;
  if (order === undefined) {
    const maxOrder = await prisma.category.findFirst({
      where: { roomId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    order = (maxOrder?.order ?? -1) + 1;
  }

  return prisma.category.create({
    data: {
      name: data.name,
      order,
      roomId,
    },
    include: {
      _count: {
        select: {
          picks: true,
        },
      },
    },
  });
}

export async function getCategory(
  categoryId: string,
): Promise<CategoryDetail | null> {
  return prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: {
          picks: true,
        },
      },
    },
  });
}

export async function getRoomCategories(
  roomId: string,
): Promise<CategoryDetail[]> {
  return prisma.category.findMany({
    where: { roomId },
    include: {
      _count: {
        select: {
          picks: true,
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });
}

export async function updateCategory(
  categoryId: string,
  data: UpdateCategoryInput,
): Promise<CategoryDetail> {
  return prisma.category.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      order: data.order,
    },
    include: {
      _count: {
        select: {
          picks: true,
        },
      },
    },
  });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) return;

  await prisma.category.delete({
    where: { id: categoryId },
  });

  const remaining = await prisma.category.findMany({
    where: { roomId: category.roomId },
    orderBy: { order: 'asc' },
  });

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i) {
      await prisma.category.update({
        where: { id: remaining[i].id },
        data: { order: i },
      });
    }
  }
}

export async function reorderCategories(
  roomId: string,
  categoryIds: string[],
): Promise<CategoryDetail[]> {
  for (let i = 0; i < categoryIds.length; i++) {
    await prisma.category.update({
      where: { id: categoryIds[i] },
      data: { order: i },
    });
  }

  return getRoomCategories(roomId);
}

export async function createCategories(
  roomId: string,
  categories: Array<{ name: string }>,
): Promise<CategoryDetail[]> {
  const maxOrder = await prisma.category.findFirst({
    where: { roomId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  let startOrder = (maxOrder?.order ?? -1) + 1;

  await prisma.category.createMany({
    data: categories.map((cat, idx) => ({
      name: cat.name,
      order: startOrder + idx,
      roomId,
    })),
  });

  return getRoomCategories(roomId);
}
