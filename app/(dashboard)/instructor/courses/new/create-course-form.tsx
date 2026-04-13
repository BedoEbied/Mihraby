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
      className="max-w-xl rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-white)] p-6 shadow-[var(--shadow-sm)]"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30"
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Price (USD)
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-[var(--color-text-secondary)]">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/30"
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
          className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-light)] disabled:opacity-50"
        >
          {createCourse.isPending ? 'Creating...' : 'Create course'}
        </button>
      </div>
    </form>
  );
}
