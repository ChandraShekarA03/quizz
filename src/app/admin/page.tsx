"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Database } from "@/lib/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !profile || profile.role !== 'admin')) {
      router.push("/dashboard");
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchTeachers();
    }
  }, [profile]);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teachers:', error);
        return;
      }

      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const updateTeacherApproval = async (teacherId: string, isApproved: boolean) => {
    setUpdating(teacherId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: isApproved })
        .eq('id', teacherId);

      if (error) {
        console.error('Error updating teacher:', error);
        return;
      }

      // Update local state
      setTeachers(teachers.map(teacher =>
        teacher.id === teacherId
          ? { ...teacher, is_approved: isApproved }
          : teacher
      ));
    } catch (error) {
      console.error('Error updating teacher:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading || loadingTeachers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'admin') {
    return null;
  }

  const pendingTeachers = teachers.filter(t => !t.is_approved);
  const approvedTeachers = teachers.filter(t => t.is_approved);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage teacher accounts and system settings
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <XCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTeachers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Teachers</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedTeachers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Management */}
        <div className="space-y-6">
          {/* Pending Teachers */}
          {pendingTeachers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <XCircle className="h-5 w-5 mr-2 text-yellow-600" />
                  Pending Teacher Approvals
                </CardTitle>
                <CardDescription>
                  Review and approve teacher registration requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTeachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{teacher.full_name || 'No name provided'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{teacher.email}</p>
                        <p className="text-xs text-gray-500">
                          Registered: {new Date(teacher.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateTeacherApproval(teacher.id, true)}
                          disabled={updating === teacher.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updating === teacher.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateTeacherApproval(teacher.id, false)}
                          disabled={updating === teacher.id}
                        >
                          {updating === teacher.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approved Teachers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Approved Teachers
              </CardTitle>
              <CardDescription>
                Currently active teacher accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedTeachers.length > 0 ? (
                <div className="space-y-4">
                  {approvedTeachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{teacher.full_name || 'No name provided'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{teacher.email}</p>
                        <p className="text-xs text-gray-500">
                          Approved: {new Date(teacher.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Approved
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTeacherApproval(teacher.id, false)}
                          disabled={updating === teacher.id}
                        >
                          {updating === teacher.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Revoke'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                  No approved teachers yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
