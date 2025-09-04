'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, Building, CreditCard, Shield, Bell, Palette, Download, Trash2, Save, Edit2, Camera, X } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import styles from '@/styles/Settings.module.scss';

export default function SettingsPage() {
  const { user, isAuthenticated, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  
  // Real user data from authentication context
  const [userData, setUserData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    businessName: user?.business_name || '',
    businessCategory: user?.business_category || ''
  });

  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_image || '/images/default-avatar.png');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update user data when user context changes
  useEffect(() => {
    if (user) {
      setUserData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        businessName: user.business_name || '',
        businessCategory: user.business_category || ''
      });
      
      // Set profile image - use full URL if it's a relative path
      if (user.profile_image) {
        if (user.profile_image.startsWith('http')) {
          setProfileImage(user.profile_image);
        } else {
          setProfileImage(`http://localhost:8000/${user.profile_image}`);
        }
      } else {
        setProfileImage('/images/default-avatar.png');
      }
    }
  }, [user]);

  const [subscriptionData] = useState({
    plan: 'Pro Plan',
    price: '$19.99/month',
    nextBilling: 'February 15, 2025',
    status: 'Active',
    trialEnds: null
  });

  const handleSave = async () => {
    if (!user) {
      Swal.fire({
        title: 'Error',
        text: 'Please log in to save your profile',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      if (!token) {
        Swal.fire({
          title: 'Authentication Error',
          text: 'Your session has expired. Please log in again.',
          icon: 'error',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        }).then(() => {
          // Redirect to login page
          window.location.href = '/login';
        });
        return;
      }

      // Update user profile
      const response = await axios.put(`http://localhost:8000/auth/users/${user.id}`, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        location: userData.location,
        bio: userData.bio,
        business_name: userData.businessName,
        business_category: userData.businessCategory
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setIsEditing(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'Your profile has been updated successfully',
        icon: 'success',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      }).then(() => {
        // Refresh user data in context after user closes the success message
        window.location.reload();
      });
      
    } catch (error: any) {
      console.error('Failed to save user data:', error);
      
      let errorMessage = 'Failed to save profile. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to update this profile.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original user data
    if (user) {
      setUserData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        businessName: user.business_name || '',
        businessCategory: user.business_category || ''
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      Swal.fire({
        title: 'File Too Large',
        text: 'Image size must be less than 5MB',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        title: 'Invalid File Type',
        text: 'Please upload a JPG, PNG, GIF, or WebP image',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
      return;
    }

    setIsImageUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:8000/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.image_path) {
        setProfileImage(`http://localhost:8000/${response.data.image_path}`);
        
        // Refresh user data from backend to update the auth context
        try {
          const userResponse = await axios.get('http://localhost:8000/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Update the user data in the auth context
          // This will trigger a re-render of all components using the user data
          window.location.reload();
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
        
        Swal.fire({
          title: 'Success!',
          text: 'Profile image uploaded successfully',
          icon: 'success',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        });
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      Swal.fire({
        title: 'Upload Failed',
        text: error.response?.data?.detail || 'Failed to upload image. Please try again.',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      await axios.delete('http://localhost:8000/profile-image', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setProfileImage('/images/default-avatar.png');
      
      // Refresh user data from backend to update the auth context
      try {
        const userResponse = await axios.get('http://localhost:8000/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Update the user data in the auth context
        // This will trigger a re-render of all components using the user data
        window.location.reload();
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
      
      Swal.fire({
        title: 'Success!',
        text: 'Profile image removed successfully',
        icon: 'success',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    } catch (error: any) {
      console.error('Remove failed:', error);
      Swal.fire({
        title: 'Remove Failed',
        text: error.response?.data?.detail || 'Failed to remove image. Please try again.',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette }
  ];

  const renderProfileTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Personal Information</h2>
        <p>Update your personal and business details</p>
      </div>

      <div className={styles.profileImageSection}>
        <div className={styles.profileImageContainer}>
          <div className={styles.profileImageWrapper}>
            <img 
              src={profileImage || '/images/default-avatar.png'} 
              alt="Profile" 
              className={styles.profileImage}
            />
            {isImageUploading && (
              <div className={styles.uploadingOverlay}>
                <div className={styles.uploadingSpinner}></div>
              </div>
            )}
            {isEditing && (
              <div className={styles.imageActions}>
                <button 
                  className={styles.imageActionButton}
                  onClick={triggerImageUpload}
                  title="Upload new image"
                >
                  <Camera size={16} />
                </button>
                {profileImage !== '/images/default-avatar.png' && (
                  <button 
                    className={styles.imageActionButton}
                    onClick={handleRemoveImage}
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className={styles.hiddenFileInput}
          />
          <p className={styles.imageHelpText}>
            Click the camera icon to upload a new profile image. 
            Maximum size: 5MB. Supported formats: JPG, PNG, GIF.
          </p>
        </div>
      </div>

      {/* Public Information Notice */}
      <div className={styles.publicInfoNotice}>
        <p><strong>Public Info:</strong> Your first name, last name initial, location, bio, business details, and profile image will be visible to others. Write something good to build credibility!</p>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              value={userData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={!isEditing}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              value={userData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={!isEditing}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={userData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={!isEditing}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            value={userData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            disabled={!isEditing}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            value={userData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            disabled={!isEditing}
            className={styles.input}
            placeholder="City, State or Country"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            value={userData.bio || ''}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            disabled={!isEditing}
            className={styles.textarea}
            rows={4}
            placeholder="Tell us about yourself, your experience, and what you do..."
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="businessName">Business Name</label>
          <input
            type="text"
            id="businessName"
            value={userData.businessName || ''}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            disabled={!isEditing}
            className={styles.input}
            placeholder="Your business name (optional)"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="businessCategory">Business Category</label>
          <select
            id="businessCategory"
            value={userData.businessCategory}
            onChange={(e) => handleInputChange('businessCategory', e.target.value)}
            disabled={!isEditing}
            className={styles.select}
          >
            <option value="Yoga Teachers & Therapists">Yoga Teachers & Therapists</option>
            <option value="Pilates Instructors">Pilates Instructors</option>
            <option value="Physical Therapists & Rehab Specialists">Physical Therapists & Rehab Specialists</option>
            <option value="Occupational Therapists">Occupational Therapists</option>
            <option value="Dance Teachers & Choreographers">Dance Teachers & Choreographers</option>
            <option value="Personal Trainers & Fitness Coaches">Personal Trainers & Fitness Coaches</option>
          </select>
        </div>

        <div className={styles.formActions}>
          {!isEditing ? (
            <button 
              className={styles.editButton}
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          ) : (
            <>
              <button 
                className={styles.saveButton}
                onClick={handleSave}
              >
                <Save size={16} />
                Save Changes
              </button>
              <button 
                className={styles.cancelButton}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderSubscriptionTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Subscription Details</h2>
        <p>Manage your subscription and billing information</p>
      </div>

      <div className={styles.subscriptionCard}>
        <div className={styles.subscriptionHeader}>
          <div className={styles.planInfo}>
            <h3>{subscriptionData.plan}</h3>
            <div className={styles.price}>{subscriptionData.price}</div>
            <div className={`${styles.status} ${styles.statusActive}`}>
              {subscriptionData.status}
            </div>
          </div>
          <div className={styles.subscriptionActions}>
            <button className={styles.actionButton}>Change Plan</button>
            <button className={styles.actionButton}>Update Payment</button>
          </div>
        </div>

        <div className={styles.subscriptionDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Next Billing Date:</span>
            <span className={styles.detailValue}>{subscriptionData.nextBilling}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Billing Cycle:</span>
            <span className={styles.detailValue}>Monthly</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Payment Method:</span>
            <span className={styles.detailValue}>•••• •••• •••• 1234</span>
          </div>
        </div>

        <div className={styles.subscriptionFooter}>
          <button className={styles.cancelSubscriptionButton}>
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Security Settings</h2>
        <p>Manage your account security and privacy</p>
      </div>

      <div className={styles.securitySection}>
        <div className={styles.securityItem}>
          <div className={styles.securityInfo}>
            <h3>Change Password</h3>
            <p>Update your password to keep your account secure</p>
          </div>
          <button className={styles.securityButton}>Change Password</button>
        </div>

        <div className={styles.securityItem}>
          <div className={styles.securityInfo}>
            <h3>Two-Factor Authentication</h3>
            <p>Add an extra layer of security to your account</p>
          </div>
          <button className={styles.securityButton}>Enable 2FA</button>
        </div>

        <div className={styles.securityItem}>
          <div className={styles.securityInfo}>
            <h3>Login History</h3>
            <p>View recent login activity and device information</p>
          </div>
          <button className={styles.securityButton}>View History</button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Notification Preferences</h2>
        <p>Choose how and when you want to be notified</p>
      </div>

      <div className={styles.notificationsSection}>
        <div className={styles.notificationItem}>
          <div className={styles.notificationInfo}>
            <h3>Email Notifications</h3>
            <p>Receive updates about your sequences and account</p>
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" defaultChecked />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.notificationItem}>
          <div className={styles.notificationInfo}>
            <h3>Sequence Reminders</h3>
            <p>Get reminded about incomplete sequences</p>
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" defaultChecked />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.notificationItem}>
          <div className={styles.notificationInfo}>
            <h3>Marketing Updates</h3>
            <p>Receive news about new features and updates</p>
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Account Preferences</h2>
        <p>Customize your MoveMosaic experience</p>
      </div>

      <div className={styles.preferencesSection}>
        <div className={styles.preferenceItem}>
          <div className={styles.preferenceInfo}>
            <h3>Data Export</h3>
            <p>Download all your sequences and data</p>
          </div>
          <button className={styles.preferenceButton}>
            <Download size={16} />
            Export Data
          </button>
        </div>

        <div className={styles.preferenceItem}>
          <div className={styles.preferenceInfo}>
            <h3>Account Deletion</h3>
            <p>Permanently delete your account and all data</p>
          </div>
          <button className={`${styles.preferenceButton} ${styles.deleteButton}`}>
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'subscription':
        return renderSubscriptionTab();
      case 'security':
        return renderSecurityTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'preferences':
        return renderPreferencesTab();
      default:
        return renderProfileTab();
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <main className={styles.main}>
        <Navbar showUserMenu={false} firstName="" lastName="" profileImage={null} />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1>Please log in to access settings</h1>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Navbar showUserMenu={true} firstName={user?.first_name || ''} lastName={user?.last_name || ''} profileImage={profileImage} />

      <section className={styles.settingsSection}>
        <div className={styles.settingsContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Account Settings</h1>
            <p className={styles.subtitle}>Manage your account and preferences</p>
          </div>

          <div className={styles.settingsContent}>
            <div className={styles.sidebar}>
              <nav className={styles.tabNavigation}>
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon size={20} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className={styles.mainContent}>
              {renderTabContent()}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
