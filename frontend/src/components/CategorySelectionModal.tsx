'use client';

import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import styles from '@/styles/UploadModal.module.scss';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface CategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (selection: {
    categoryId: string | null;
    industryLabel: string;
  }) => void;
  initialData?: {
    categoryId: string | null;
    industryLabel: string;
  };
}

const industryLabels = [
  'Yoga',
  'Pilates', 
  'Physical Therapy',
  'Personal Training',
  'Dance',
  'Martial Arts',
  'Chiropractic',
  'Coaching',
  'Other'
];

export default function CategorySelectionModal({
  isOpen,
  onClose,
  onNext,
  initialData
}: CategorySelectionModalProps) {
  const { user, token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.categoryId || '');
  const [selectedLabel, setSelectedLabel] = useState<string>(initialData?.industryLabel || 'Yoga');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen && token) {
      fetchCategories();
    }
  }, [isOpen, token]);

  const fetchCategories = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get('http://localhost:8000/sequences/categories/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Please enter a category name',
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
      return;
    }

    if (!user || !token) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please log in to create categories',
        icon: 'warning',
        confirmButtonColor: '#b8336a',
      });
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/sequences/categories/', {
        name: newCategoryName,
        description: newCategoryDescription,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setCategories(prev => [...prev, response.data]);
      setSelectedCategory(response.data.id);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowNewCategory(false);

      Swal.fire({
        title: 'Success!',
        text: 'Category created successfully',
        icon: 'success',
        confirmButtonColor: '#b8336a',
      });
    } catch (error) {
      console.error('Failed to create category:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to create category. Please try again.',
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
    }
  };

  const handleNext = () => {
    onNext({
      categoryId: selectedCategory || null,
      industryLabel: selectedLabel
    });
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={`btn-tertiary btn-sm ${styles.closeButton}`} onClick={handleClose}>
          <X size={24} />
        </button>

        <div className={styles.content}>
          <div className={styles.step}>
            <div className={styles.icon}>
              <Tag size={48} />
            </div>
            
            <h2 className={styles.title}>Categories & Labels</h2>
            <p className={styles.description}>
              Choose a category and industry label for your sequence
            </p>

            <div className={styles.formSection}>
              {/* Category Selection */}
              <div className={styles.formGroup}>
                <label>Category</label>
                <div className={styles.categorySection}>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    className="btn-secondary btn-sm"
                  >
                    <Plus size={16} />
                    {showNewCategory ? 'Cancel' : 'New Category'}
                  </button>
                </div>

                {showNewCategory && (
                  <div className={styles.newCategoryForm}>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className={styles.input}
                    />
                    <input
                      type="text"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className={styles.input}
                    />
                    <button
                      onClick={handleCreateCategory}
                      className="btn-primary btn-sm"
                    >
                      Create Category
                    </button>
                  </div>
                )}
              </div>

              {/* Industry Label Selection */}
              <div className={styles.formGroup}>
                <label>Industry Label</label>
                <div className={styles.labelGrid}>
                  {industryLabels.map((label) => (
                    <label key={label} className={styles.labelOption}>
                      <input
                        type="radio"
                        name="industryLabel"
                        value={label}
                        checked={selectedLabel === label}
                        onChange={(e) => setSelectedLabel(e.target.value)}
                      />
                      <span className={styles.labelText}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="btn-group">
              <button
                onClick={handleClose}
                className="btn-tertiary"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="btn-primary"
              >
                Next: Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
