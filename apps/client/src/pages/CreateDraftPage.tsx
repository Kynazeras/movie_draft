import { useState, FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { api } from '../lib/api';

interface Category {
  id: string;
  name: string;
}

 
const SUGGESTED_CATEGORIES = [
  'Horror / Action/ Thriller',
  'Comedy',
  'Drama',
  'Oscar Winner',
  '100+ Million Box Office',
  'Animated',
  'Sequel',
  'Musical',
  'Tom Cruise has a tiny ponytail',
];

export function CreateDraftPage() {
  const navigate = useNavigate();

   
  const [roomName, setRoomName] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

   
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

   
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addCategory = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

     
    if (
      categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      return;
    }

    setCategories([...categories, { id: generateId(), name: trimmedName }]);
    setNewCategoryName('');
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCategory(newCategoryName);
    }
  };

  const moveCategory = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= categories.length) return;

    const newCategories = [...categories];
    const [removed] = newCategories.splice(fromIndex, 1);
    newCategories.splice(toIndex, 0, removed);
    setCategories(newCategories);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    moveCategory(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!roomName.trim()) {
      setError('Please enter a draft name');
      return;
    }

    if (categories.length === 0) {
      setError('Please add at least one category');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
       
      const room = await api.createRoom(roomName.trim());

       
      await api.addCategories(
        room.id,
        categories.map((c) => ({ name: c.name })),
      );

       
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft');
      setIsCreating(false);
    }
  };

  const addSuggested = (suggestion: string) => {
    addCategory(suggestion);
  };

   
  const availableSuggestions = SUGGESTED_CATEGORIES.filter(
    (s) => !categories.some((c) => c.name.toLowerCase() === s.toLowerCase()),
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            Create a Draft
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Set up your movie draft with custom categories
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error display */}
          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
              <p className="text-[var(--color-error)]">{error}</p>
            </div>
          )}

          {/* Draft Name */}
          <div className="glass rounded-xl p-6">
            <label className="block text-lg font-semibold text-[var(--color-text)] mb-4">
              Draft Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Movie Night Draft 2026"
              className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all text-lg"
              maxLength={100}
            />
          </div>

          {/* Categories */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-[var(--color-text)]">
                Categories
              </label>
              <span className="text-sm text-[var(--color-text-muted)]">
                {categories.length} added
              </span>
            </div>

            {/* Add category input */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a category (e.g., Best Action Movie)"
                className="flex-1 px-4 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                maxLength={100}
              />
              <button
                type="button"
                onClick={() => addCategory(newCategoryName)}
                disabled={!newCategoryName.trim()}
                className="px-6 py-3 font-semibold text-[var(--color-text)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {/* Category list */}
            {categories.length > 0 && (
              <div className="space-y-2 mb-6">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  Drag to reorder categories
                </p>
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] group cursor-move transition-all ${
                      draggedIndex === index ? 'opacity-50 scale-[0.98]' : ''
                    }`}
                  >
                    {/* Drag handle */}
                    <div className="text-[var(--color-text-muted)] cursor-move">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                    </div>

                    {/* Order number */}
                    <span className="w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                      {index + 1}
                    </span>

                    {/* Category name */}
                    <span className="flex-1 text-[var(--color-text)]">
                      {category.name}
                    </span>

                    {/* Move buttons */}
                    <button
                      type="button"
                      onClick={() => moveCategory(index, index - 1)}
                      disabled={index === 0}
                      className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(index, index + 1)}
                      disabled={index === categories.length - 1}
                      className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeCategory(category.id)}
                      className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                      title="Remove category"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested categories */}
            {availableSuggestions.length > 0 && (
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-3">
                  Quick add suggestions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => addSuggested(suggestion)}
                      className="px-3 py-1.5 text-sm rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 font-semibold text-[var(--color-text)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isCreating || !roomName.trim() || categories.length === 0
              }
              className="flex-1 px-6 py-3 font-semibold text-[var(--color-background)] bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-[var(--shadow-glow)]"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-[var(--color-background)] border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Draft
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default CreateDraftPage;
