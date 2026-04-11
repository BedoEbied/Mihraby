'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCourse } from '@/features/courses/api';
import type { CreateCourseDTO } from '@/lib/types';

export function CreateCourseForm() {
  const router = useRouter();
  const createCourse = useCreateCourse();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (Number.isNaN(numPrice) || numPrice < 0) {
      return;
    }
    const data: CreateCourseDTO = {
      title: title.trim(),
      description: description.trim() || undefined,
      price: numPrice,
      status,
      price_per_slot: numPrice,
    };
    createCourse.mutate(data, {
      onSuccess: (course) => {
        router.push(`/instructor/courses/${course.id}`);
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price ($)
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={createCourse.isPending}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {createCourse.isPending ? 'Creating...' : 'Create course'}
        </button>
      </div>
    </form>
  );
}
