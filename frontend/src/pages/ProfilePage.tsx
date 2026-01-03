import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Loader from '../components/Loader';
import BackButton from '../components/BackButton';

interface ProfileData {
  id: string;
  loginId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  designation: string;
  department: string;
  manager: string;
  location: string;
  dateOfJoining: string;
  yearOfJoining: number;
  dateOfBirth: string;
  residingAddress: string;
  nationality: string;
  personalEmail: string;
  gender: string;
  maritalStatus: string;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
  panNumber: string;
  uanNumber: string;
  employeeCode: string;
  about: string;
  jobDescription: string;
  interests: string;
  skills: Array<{ name: string; level: string }>;
  certifications: Array<{ name: string; issuer: string; issueDate: string; expiryDate: string; certificateNumber: string }>;
  company: { id: string; name: string; code: string };
}

interface SalaryData {
  wageType: string;
  monthlyWage: number;
  yearlyWage: number;
  workingDaysPerWeek: number;
  breakTimeHours: number;
  components: any;
  providentFund: any;
  professionalTax: any;
}

export default function ProfilePage() {
  const { id } = useParams<{ id?: string }>();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('resume');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [salary, setSalary] = useState<SalaryData | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const profileId = id || currentUser?.id;
  const canEditAll = currentUser?.role === 'admin';
  const isOwnProfile = profileId === currentUser?.id;
  // Admins can always edit any profile, employees can only edit their own
  const canEdit = canEditAll || isOwnProfile;

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`/api/profile/${profileId}`);
      setProfile(response.data.data.profile);
      setSalary(response.data.data.salary);
      setFormData(response.data.data.profile);
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/profile/${profileId}`, formData);
      await fetchProfile();
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSalaryUpdate = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/profile/${profileId}/salary`, salary);
      await fetchProfile();
      alert('Salary updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update salary');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (skill: { name: string; level: string }) => {
    setSaving(true);
    try {
      const updatedSkills = [...(profile?.skills || []), skill];
      await axios.put(`/api/profile/${profileId}`, { skills: updatedSkills });
      await fetchProfile();
      setShowSkillModal(false);
      alert('Skill added successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add skill');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCertification = async (cert: { name: string; issuer: string; issueDate: string; expiryDate: string; certificateNumber: string }) => {
    setSaving(true);
    try {
      const updatedCerts = [...(profile?.certifications || []), cert];
      await axios.put(`/api/profile/${profileId}`, { certifications: updatedCerts });
      await fetchProfile();
      setShowCertModal(false);
      alert('Certification added successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add certification');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Profile not found</p>
            <div className="flex items-center gap-3 mt-4">
              <BackButton to="/employees" />
              <span className="text-sm text-muted-foreground">Back to Employees</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin can edit all fields, employees can only edit limited fields
  const isFieldEditable = (fieldName: string) => {
    if (!canEdit) return false;
    if (canEditAll) return true; // Admin can edit everything
    // Employees can edit: name, email, phone, department, location, manager, avatar, about, interests
    return ['firstName', 'lastName', 'email', 'phone', 'department', 'location', 'manager', 'avatar', 'about', 'interests'].includes(fieldName);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BackButton to="/employees" />
            <span className="text-sm text-muted-foreground">Back to Employees</span>
          </div>
          {profileId !== currentUser?.id && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Viewing:</span> {profile.firstName} {profile.lastName}'s Profile
              </div>
              {canEditAll && !isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Employee Data
                </Button>
              )}
            </div>
          )}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                <img
                  src={avatarPreview || profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.firstName + ' ' + profile.lastName)}&background=random`}
                  alt={profile.firstName + ' ' + profile.lastName}
                  className="w-32 h-32 rounded-full border-4 border-gray-200 object-cover"
                />
                {isEditing && canEdit && isFieldEditable('avatar') && (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      id="avatar-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image size should be less than 5MB');
                            return;
                          }
                          // Validate file type
                          if (!file.type.startsWith('image/')) {
                            alert('Please select a valid image file');
                            return;
                          }
                          
                          // Compress and resize image before converting to base64
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const img = new Image();
                            img.onload = () => {
                              // Create canvas to resize image
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 400;
                              const MAX_HEIGHT = 400;
                              let width = img.width;
                              let height = img.height;

                              // Calculate new dimensions
                              if (width > height) {
                                if (width > MAX_WIDTH) {
                                  height *= MAX_WIDTH / width;
                                  width = MAX_WIDTH;
                                }
                              } else {
                                if (height > MAX_HEIGHT) {
                                  width *= MAX_HEIGHT / height;
                                  height = MAX_HEIGHT;
                                }
                              }

                              canvas.width = width;
                              canvas.height = height;

                              // Draw and compress
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, width, height);

                              // Convert to base64 with compression (quality 0.8)
                              const base64String = canvas.toDataURL('image/jpeg', 0.8);
                              setAvatarPreview(base64String);
                              setFormData({ ...formData, avatar: base64String });
                            };
                            img.src = reader.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-primary/90 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </label>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>My Name</Label>
                  {isEditing && isFieldEditable('firstName') ? (
                    <div className="flex gap-2">
                      <Input
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="First Name"
                      />
                      <Input
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Last Name"
                      />
                    </div>
                  ) : (
                    <p className="text-lg font-semibold">{profile.firstName} {profile.lastName}</p>
                  )}
                </div>
                <div>
                  <Label>Login ID</Label>
                  {isEditing && isFieldEditable('loginId') ? (
                    <Input
                      value={formData.loginId || ''}
                      onChange={(e) => setFormData({ ...formData, loginId: e.target.value.toUpperCase() })}
                      className="font-mono"
                    />
                  ) : (
                    <p className="font-mono">{profile.loginId}</p>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  {isEditing && isFieldEditable('email') ? (
                    <Input
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  ) : (
                    <p>{profile.email || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Mobile</Label>
                  {isEditing && isFieldEditable('phone') ? (
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  ) : (
                    <p>{profile.phone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Company</Label>
                  <p>{profile.company?.name || 'Not provided'}</p>
                </div>
                {!isEditing && (
                  <div>
                    <Label>Year of Joining</Label>
                    <p>{profile.yearOfJoining || 'Not provided'}</p>
                  </div>
                )}
                {isEditing && isFieldEditable('yearOfJoining') && (
                  <div>
                    <Label>Year of Joining</Label>
                    <Input
                      type="number"
                      value={formData.yearOfJoining || ''}
                      onChange={(e) => setFormData({ ...formData, yearOfJoining: parseInt(e.target.value) || 0 })}
                      min="2000"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                )}
                <div>
                  <Label>Department</Label>
                  {isEditing && isFieldEditable('department') ? (
                    <Input
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  ) : (
                    <p>{profile.department || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Manager</Label>
                  {isEditing && isFieldEditable('manager') ? (
                    <Input
                      value={formData.manager || ''}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    />
                  ) : (
                    <p>{profile.manager || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Location</Label>
                  {isEditing && isFieldEditable('location') ? (
                    <Input
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  ) : (
                    <p>{profile.location || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="mt-4 flex justify-end">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button onClick={() => { 
                      setIsEditing(false); 
                      setFormData(profile); 
                      setAvatarPreview(null); // Clear avatar preview on cancel
                    }} variant="outline">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    Edit Profile
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs - Only show for own profile or admin viewing any profile */}
        {(isOwnProfile || canEditAll) && (
          <>
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {['resume', 'privateInfo', ...(canEditAll ? ['salaryInfo'] : []), 'security'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer transition-all duration-200 ${
                      activeTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'resume' && 'Resume'}
                    {tab === 'privateInfo' && 'Private Info'}
                    {tab === 'salaryInfo' && 'Salary Info'}
                    {tab === 'security' && 'Security'}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
            {activeTab === 'resume' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing && isFieldEditable('about') ? (
                      <textarea
                        value={formData.about || ''}
                        onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-700">{profile.about || 'No information provided.'}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>What I love about my job</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing && isFieldEditable('jobDescription') ? (
                      <textarea
                        value={formData.jobDescription || ''}
                        onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        placeholder="Describe what you love about your job..."
                      />
                    ) : (
                      <p className="text-gray-700">{profile.jobDescription || 'No information provided.'}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>My interests and hobbies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing && isFieldEditable('interests') ? (
                      <div className="space-y-3">
                        <textarea
                          value={formData.interests || ''}
                          onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          placeholder="Share your interests and hobbies..."
                        />
                        <div className="flex justify-end">
                          <Button onClick={handleSave} disabled={saving} size="sm">
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700">{profile.interests || 'No information provided.'}</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'privateInfo' && (
              <Card>
                <CardHeader>
                  <CardTitle>Private Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date of Birth</Label>
                      {isEditing && isFieldEditable('dateOfBirth') ? (
                        <Input
                          type="date"
                          value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        />
                      ) : (
                        <p>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Date of Joining</Label>
                      {isEditing && isFieldEditable('dateOfJoining') ? (
                        <Input
                          type="date"
                          value={formData.dateOfJoining ? new Date(formData.dateOfJoining).toISOString().split('T')[0] : ''}
                          onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                        />
                      ) : (
                        <p>{profile.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : 'Not provided'}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label>Residing Address</Label>
                      {isEditing && isFieldEditable('residingAddress') ? (
                        <Input
                          value={formData.residingAddress || ''}
                          onChange={(e) => setFormData({ ...formData, residingAddress: e.target.value })}
                        />
                      ) : (
                        <p>{profile.residingAddress || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Nationality</Label>
                      {isEditing && isFieldEditable('nationality') ? (
                        <Input
                          value={formData.nationality || ''}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        />
                      ) : (
                        <p>{profile.nationality || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Personal Email</Label>
                      {isEditing && isFieldEditable('personalEmail') ? (
                        <Input
                          type="email"
                          value={formData.personalEmail || ''}
                          onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                        />
                      ) : (
                        <p>{profile.personalEmail || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Gender</Label>
                      {isEditing && isFieldEditable('gender') ? (
                        <select
                          value={formData.gender || ''}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full h-10 px-3 border rounded-md"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <p>{profile.gender || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Marital Status</Label>
                      {isEditing && isFieldEditable('maritalStatus') ? (
                        <select
                          value={formData.maritalStatus || ''}
                          onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                          className="w-full h-10 px-3 border rounded-md"
                        >
                          <option value="">Select</option>
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                        </select>
                      ) : (
                        <p>{profile.maritalStatus || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Account Number</Label>
                        {isEditing && isFieldEditable('bankAccountNumber') ? (
                          <Input
                            value={formData.bankAccountNumber || ''}
                            onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                          />
                        ) : (
                          <p>{profile.bankAccountNumber || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <Label>Bank Name</Label>
                        {isEditing && isFieldEditable('bankName') ? (
                          <Input
                            value={formData.bankName || ''}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          />
                        ) : (
                          <p>{profile.bankName || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <Label>IFSC Code</Label>
                        {isEditing && isFieldEditable('ifscCode') ? (
                          <Input
                            value={formData.ifscCode || ''}
                            onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                          />
                        ) : (
                          <p>{profile.ifscCode || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <Label>PAN No</Label>
                        {isEditing && isFieldEditable('panNumber') ? (
                          <Input
                            value={formData.panNumber || ''}
                            onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                          />
                        ) : (
                          <p>{profile.panNumber || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <Label>UAN No</Label>
                        {isEditing && isFieldEditable('uanNumber') ? (
                          <Input
                            value={formData.uanNumber || ''}
                            onChange={(e) => setFormData({ ...formData, uanNumber: e.target.value })}
                          />
                        ) : (
                          <p>{profile.uanNumber || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <Label>Emp Code</Label>
                        {isEditing && isFieldEditable('employeeCode') ? (
                          <Input
                            value={formData.employeeCode || ''}
                            onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                          />
                        ) : (
                          <p>{profile.employeeCode || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'salaryInfo' && canEditAll && salary && (
              <SalaryInfoTab salary={salary} setSalary={setSalary} onSave={handleSalaryUpdate} saving={saving} />
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Security settings will be available here.</p>
                </CardContent>
              </Card>
            )}
          </div>

              {/* Right Column - Skills and Certifications */}
              <div className="space-y-6">
                <SkillsSection 
                  skills={profile.skills || []} 
                  onAddClick={() => setShowSkillModal(true)}
                  canEdit={canEdit}
                />
                <CertificationsSection 
                  certifications={profile.certifications || []} 
                  onAddClick={() => setShowCertModal(true)}
                  canEdit={canEdit}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Skill Modal */}
      {showSkillModal && (
        <AddSkillModal
          onClose={() => setShowSkillModal(false)}
          onSave={handleAddSkill}
          saving={saving}
        />
      )}

      {/* Add Certification Modal */}
      {showCertModal && (
        <AddCertificationModal
          onClose={() => setShowCertModal(false)}
          onSave={handleAddCertification}
          saving={saving}
        />
      )}
    </div>
  );
}

// Skills Component
function SkillsSection({ skills, onAddClick, canEdit }: { skills: Array<{ name: string; level: string }>; onAddClick: () => void; canEdit: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-2">No skills added</p>
            {canEdit && (
              <button 
                onClick={onAddClick}
                className="text-primary text-sm hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Skills
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {skills.map((skill, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{skill.name}</span>
                <span className="text-xs text-gray-500 capitalize">{skill.level}</span>
              </div>
            ))}
            {canEdit && (
              <button 
                onClick={onAddClick}
                className="text-primary text-sm hover:underline mt-2 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Skills
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Certifications Component
function CertificationsSection({ certifications, onAddClick, canEdit }: { certifications: Array<{ name: string; issuer: string; issueDate: string; expiryDate: string; certificateNumber: string }>; onAddClick: () => void; canEdit: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Certification</CardTitle>
      </CardHeader>
      <CardContent>
        {certifications.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-2">No certifications added</p>
            {canEdit && (
              <button 
                onClick={onAddClick}
                className="text-primary text-sm hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Certification
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert, index) => (
              <div key={index} className="border-b pb-2">
                <p className="font-medium">{cert.name}</p>
                <p className="text-sm text-gray-600">{cert.issuer}</p>
                {cert.issueDate && (
                  <p className="text-xs text-gray-500">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                )}
              </div>
            ))}
            {canEdit && (
              <button 
                onClick={onAddClick}
                className="text-primary text-sm hover:underline mt-2 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Certification
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Salary Info Tab Component (Admin Only)
function SalaryInfoTab({ salary, setSalary, onSave, saving }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [localSalary, setLocalSalary] = useState<any>(salary);

  useEffect(() => {
    if (salary) {
      setLocalSalary(salary);
    }
  }, [salary]);

  const handleWageChange = (field: string, value: number) => {
    const updated = { ...localSalary, [field]: value };
    if (field === 'monthlyWage') {
      updated.yearlyWage = value * 12;
    } else if (field === 'yearlyWage') {
      updated.monthlyWage = value / 12;
    }
    setLocalSalary(updated);
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Salary Info</CardTitle>
          {isEditing ? (
            <div className="flex gap-2">
              <Button onClick={() => { setIsEditing(false); setLocalSalary(salary); }} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={() => { setSalary(localSalary); onSave(); setIsEditing(false); }} disabled={saving} size="sm">
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Edit
            </Button>
          )}
        </div>
        <p className="text-sm text-yellow-600 mt-2">Salary Info tab should only be visible to Admin</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wage Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Month Wage</Label>
            {isEditing ? (
              <Input
                type="number"
                value={localSalary.monthlyWage || 0}
                onChange={(e) => handleWageChange('monthlyWage', parseFloat(e.target.value) || 0)}
              />
            ) : (
              <p className="font-semibold">{localSalary.monthlyWage?.toLocaleString('en-IN')} ₹/month</p>
            )}
          </div>
          <div>
            <Label>Yearly wage</Label>
            {isEditing ? (
              <Input
                type="number"
                value={localSalary.yearlyWage || 0}
                onChange={(e) => handleWageChange('yearlyWage', parseFloat(e.target.value) || 0)}
              />
            ) : (
              <p className="font-semibold">{localSalary.yearlyWage?.toLocaleString('en-IN')} ₹/yearly</p>
            )}
          </div>
        </div>

        {/* Working Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>No of working days in a week</Label>
            {isEditing ? (
              <Input
                type="number"
                value={localSalary.workingDaysPerWeek || 5}
                onChange={(e) => setLocalSalary({ ...localSalary, workingDaysPerWeek: parseInt(e.target.value) || 5 })}
              />
            ) : (
              <p>{localSalary.workingDaysPerWeek || 5} days</p>
            )}
          </div>
          <div>
            <Label>Break Time</Label>
            {isEditing ? (
              <Input
                type="number"
                value={localSalary.breakTimeHours || 1}
                onChange={(e) => setLocalSalary({ ...localSalary, breakTimeHours: parseFloat(e.target.value) || 1 })}
              />
            ) : (
              <p>{localSalary.breakTimeHours || 1} hrs</p>
            )}
          </div>
        </div>

        {/* Salary Components */}
        <div>
          <h3 className="font-semibold mb-4">Salary Components</h3>
          <div className="space-y-4">
            {localSalary.components && Object.entries(localSalary.components).map(([key, component]: [string, any]) => (
              <div key={key} className="border rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <div className="text-right">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={component.amount || 0}
                            onChange={(e) => {
                              const updated = { ...localSalary };
                              updated.components[key].amount = parseFloat(e.target.value) || 0;
                              if (updated.monthlyWage > 0) {
                                updated.components[key].percentage = (updated.components[key].amount / updated.monthlyWage) * 100;
                              }
                              setLocalSalary(updated);
                            }}
                            className="w-32"
                            placeholder="Amount"
                          />
                          <span className="text-sm">₹/month</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={component.percentage || 0}
                            onChange={(e) => {
                              const updated = { ...localSalary };
                              updated.components[key].percentage = parseFloat(e.target.value) || 0;
                              if (updated.monthlyWage > 0 && updated.components[key].computationType === 'percentage') {
                                updated.components[key].amount = (updated.monthlyWage * updated.components[key].percentage) / 100;
                              }
                              setLocalSalary(updated);
                            }}
                            className="w-24"
                            placeholder="%"
                          />
                          <span className="text-sm">%</span>
                        </div>
                        <select
                          value={component.computationType || 'percentage'}
                          onChange={(e) => {
                            const updated = { ...localSalary };
                            updated.components[key].computationType = e.target.value;
                            // If switching to fixed and it's standardAllowance, use fixedAmount
                            if (e.target.value === 'fixed' && key === 'standardAllowance' && updated.components[key].fixedAmount) {
                              updated.components[key].amount = updated.components[key].fixedAmount;
                            }
                            setLocalSalary(updated);
                          }}
                          className="w-full h-8 px-2 border rounded text-sm"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed</option>
                        </select>
                        {/* Show fixedAmount input for Standard Allowance when computation type is fixed */}
                        {isEditing && key === 'standardAllowance' && component.computationType === 'fixed' && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Fixed Amount:</Label>
                            <Input
                              type="number"
                              value={component.fixedAmount || 0}
                              onChange={(e) => {
                                const updated = { ...localSalary };
                                updated.components[key].fixedAmount = parseFloat(e.target.value) || 0;
                                updated.components[key].amount = updated.components[key].fixedAmount;
                                if (updated.monthlyWage > 0) {
                                  updated.components[key].percentage = (updated.components[key].amount / updated.monthlyWage) * 100;
                                }
                                setLocalSalary(updated);
                              }}
                              className="w-32 text-xs"
                              placeholder="Fixed Amount"
                            />
                            <span className="text-xs">₹/month</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold">{component.amount?.toLocaleString('en-IN')} ₹/month</p>
                        <p className="text-sm text-gray-600">{component.percentage?.toFixed(2)} %</p>
                      </>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <div className="mt-2">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={component.description || ''}
                      onChange={(e) => {
                        const updated = { ...localSalary };
                        updated.components[key].description = e.target.value;
                        setLocalSalary(updated);
                      }}
                      className="text-xs"
                      placeholder="Component description"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">{component.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PF Contribution */}
        <div>
          <h3 className="font-semibold mb-4">Provident Fund (PF) Contribution</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-4">
              <h4 className="font-medium mb-2">Employee</h4>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={localSalary.providentFund?.employeeContribution?.amount || 0}
                      onChange={(e) => {
                        const updated = { ...localSalary };
                        updated.providentFund.employeeContribution.amount = parseFloat(e.target.value) || 0;
                        setLocalSalary(updated);
                      }}
                      className="w-32"
                    />
                    <span className="text-sm">₹/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={localSalary.providentFund?.employeeContribution?.percentage || 0}
                      onChange={(e) => {
                        const updated = { ...localSalary };
                        updated.providentFund.employeeContribution.percentage = parseFloat(e.target.value) || 0;
                        setLocalSalary(updated);
                      }}
                      className="w-24"
                    />
                    <span className="text-sm">%</span>
                  </div>
                  <Input
                    value={localSalary.providentFund?.employeeContribution?.description || ''}
                    onChange={(e) => {
                      const updated = { ...localSalary };
                      updated.providentFund.employeeContribution.description = e.target.value;
                      setLocalSalary(updated);
                    }}
                    className="text-xs"
                    placeholder="Description"
                  />
                </div>
              ) : (
                <>
                  <p className="font-semibold">{localSalary.providentFund?.employeeContribution?.amount?.toLocaleString('en-IN')} ₹/month</p>
                  <p className="text-sm text-gray-600">{localSalary.providentFund?.employeeContribution?.percentage} %</p>
                  <p className="text-xs text-gray-500 mt-2">{localSalary.providentFund?.employeeContribution?.description}</p>
                </>
              )}
            </div>
            <div className="border rounded-md p-4">
              <h4 className="font-medium mb-2">Employer</h4>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={localSalary.providentFund?.employerContribution?.amount || 0}
                      onChange={(e) => {
                        const updated = { ...localSalary };
                        updated.providentFund.employerContribution.amount = parseFloat(e.target.value) || 0;
                        setLocalSalary(updated);
                      }}
                      className="w-32"
                    />
                    <span className="text-sm">₹/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={localSalary.providentFund?.employerContribution?.percentage || 0}
                      onChange={(e) => {
                        const updated = { ...localSalary };
                        updated.providentFund.employerContribution.percentage = parseFloat(e.target.value) || 0;
                        setLocalSalary(updated);
                      }}
                      className="w-24"
                    />
                    <span className="text-sm">%</span>
                  </div>
                  <Input
                    value={localSalary.providentFund?.employerContribution?.description || ''}
                    onChange={(e) => {
                      const updated = { ...localSalary };
                      updated.providentFund.employerContribution.description = e.target.value;
                      setLocalSalary(updated);
                    }}
                    className="text-xs"
                    placeholder="Description"
                  />
                </div>
              ) : (
                <>
                  <p className="font-semibold">{localSalary.providentFund?.employerContribution?.amount?.toLocaleString('en-IN')} ₹/month</p>
                  <p className="text-sm text-gray-600">{localSalary.providentFund?.employerContribution?.percentage} %</p>
                  <p className="text-xs text-gray-500 mt-2">{localSalary.providentFund?.employerContribution?.description}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tax Deductions */}
        <div>
          <h3 className="font-semibold mb-4">Tax Deductions</h3>
          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-2">Professional Tax</h4>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={localSalary.professionalTax?.amount || 0}
                    onChange={(e) => {
                      const updated = { ...localSalary };
                      updated.professionalTax.amount = parseFloat(e.target.value) || 0;
                      setLocalSalary(updated);
                    }}
                    className="w-32"
                  />
                  <span className="text-sm">₹/month</span>
                </div>
                <Input
                  value={localSalary.professionalTax?.description || ''}
                  onChange={(e) => {
                    const updated = { ...localSalary };
                    updated.professionalTax.description = e.target.value;
                    setLocalSalary(updated);
                  }}
                  className="text-xs"
                  placeholder="Description"
                />
              </div>
            ) : (
              <>
                <p className="font-semibold">{localSalary.professionalTax?.amount?.toLocaleString('en-IN')} ₹/month</p>
                <p className="text-xs text-gray-500 mt-2">{localSalary.professionalTax?.description}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Add Skill Modal Component
function AddSkillModal({ onClose, onSave, saving }: { onClose: () => void; onSave: (skill: { name: string; level: string }) => void; saving: boolean }) {
  const [skillName, setSkillName] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      alert('Please enter a skill name');
      return;
    }
    onSave({ name: skillName.trim(), level: skillLevel });
    setSkillName('');
    setSkillLevel('beginner');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Add Skill</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="skillName">Skill Name</Label>
              <Input
                id="skillName"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g., JavaScript, Python, React"
                required
              />
            </div>
            <div>
              <Label htmlFor="skillLevel">Skill Level</Label>
              <select
                id="skillLevel"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                className="w-full h-10 px-3 border rounded-md"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Skill'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Add Certification Modal Component
function AddCertificationModal({ onClose, onSave, saving }: { onClose: () => void; onSave: (cert: { name: string; issuer: string; issueDate: string; expiryDate: string; certificateNumber: string }) => void; saving: boolean }) {
  const [certName, setCertName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim() || !issuer.trim()) {
      alert('Please enter certification name and issuer');
      return;
    }
    onSave({
      name: certName.trim(),
      issuer: issuer.trim(),
      issueDate: issueDate || '',
      expiryDate: expiryDate || '',
      certificateNumber: certificateNumber.trim() || ''
    });
    setCertName('');
    setIssuer('');
    setIssueDate('');
    setExpiryDate('');
    setCertificateNumber('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Add Certification</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="certName">Certification Name</Label>
              <Input
                id="certName"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                placeholder="e.g., AWS Certified Solutions Architect"
                required
              />
            </div>
            <div>
              <Label htmlFor="issuer">Issuing Organization</Label>
              <Input
                id="issuer"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g., Amazon Web Services"
                required
              />
            </div>
            <div>
              <Label htmlFor="certificateNumber">Certificate Number (Optional)</Label>
              <Input
                id="certificateNumber"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="Certificate number or ID"
              />
            </div>
            <div>
              <Label htmlFor="issueDate">Issue Date (Optional)</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Certification'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

