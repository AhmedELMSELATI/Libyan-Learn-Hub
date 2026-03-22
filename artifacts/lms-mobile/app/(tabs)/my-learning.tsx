import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";

const C = Colors.light;

interface Enrollment {
  id: number;
  courseId: number;
  progress: number;
  enrolledAt: string;
  course: {
    id: number;
    title: string;
    titleAr: string;
    teacherName: string;
    lessonCount: number;
    totalDuration: number;
    thumbnailUrl?: string | null;
  };
}

function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${Math.min(value, 100)}%` as any }]} />
    </View>
  );
}

function EnrollmentCard({ item }: { item: Enrollment }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: "/course/[id]", params: { id: item.courseId.toString() } })}
    >
      <View style={styles.cardThumb}>
        <Feather name="book-open" size={28} color={C.tint} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.course.titleAr || item.course.title}</Text>
        <Text style={styles.cardTeacher}>{item.course.teacherName}</Text>
        <View style={styles.progressRow}>
          <ProgressBar value={item.progress} />
          <Text style={styles.progressPct}>{Math.round(item.progress)}%</Text>
        </View>
        <Text style={styles.cardMeta}>
          {item.course.lessonCount} درس · {Math.round(item.course.totalDuration / 60)} ساعة
        </Text>
      </View>
      <Feather name="chevron-left" size={18} color={C.textMuted} />
    </Pressable>
  );
}

// ── Teacher Dashboard ─────────────────────────────────────────────────────────

function TeacherDashboard() {
  const insets = useSafeAreaInsets();
  const { apiFetch } = useApi();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [createOpen, setCreateOpen] = useState(false);
  const [createListingOpen, setCreateListingOpen] = useState(false);
  const [form, setForm] = useState({ title: "", titleAr: "", description: "", scheduledAt: "", durationMinutes: "90", maxParticipants: "50" });
  const [listingForm, setListingForm] = useState({ titleAr: "", title: "", subjectAr: "", subject: "", gradeLevel: "", hourlyRate: "", availableDays: "", availableTimeFrom: "", availableTimeTo: "", sessionDurationMinutes: "60", maxStudents: "1", descriptionAr: "" });


  const { data: courses = [], isLoading: coursesLoading } = useQuery<any[]>({
    queryKey: ["teacher-courses"],
    queryFn: () => apiFetch("/teacher/courses"),
  });

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["live-sessions"],
    queryFn: () => apiFetch("/live-sessions"),
  });

  const { data: listings = [] } = useQuery<any[]>({
    queryKey: ["tutoring-listings-my"],
    queryFn: () => apiFetch("/tutoring-listings/my"),
  });

  const createSession = async () => {
    try {
      await apiFetch("/live-sessions", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          durationMinutes: parseInt(form.durationMinutes),
          maxParticipants: parseInt(form.maxParticipants),
          scheduledAt: form.scheduledAt,
          meetingUrl: `https://meet.jit.si/edulibya-${Date.now()}`,
        }),
      });
      Alert.alert("تم!", "تم إنشاء الجلسة المباشرة.");
      queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
      setCreateOpen(false);
      setForm({ title: "", titleAr: "", description: "", scheduledAt: "", durationMinutes: "90", maxParticipants: "50" });
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "فشل إنشاء الجلسة");
    }
  };

  const createListing = async () => {
    if (!listingForm.titleAr || !listingForm.subjectAr || !listingForm.hourlyRate) {
      Alert.alert("خطأ", "يرجى ملء الحقول المطلوبة: العنوان، المادة، والسعر");
      return;
    }
    try {
      await apiFetch("/tutoring-listings", {
        method: "POST",
        body: JSON.stringify({
          ...listingForm,
          hourlyRate: parseFloat(listingForm.hourlyRate),
          sessionDurationMinutes: parseInt(listingForm.sessionDurationMinutes),
          maxStudents: parseInt(listingForm.maxStudents),
        }),
      });
      Alert.alert("تم!", "تم إنشاء إعلان الدروس الخصوصية.");
      queryClient.invalidateQueries({ queryKey: ["tutoring-listings-my"] });
      setCreateListingOpen(false);
      setListingForm({ titleAr: "", title: "", subjectAr: "", subject: "", gradeLevel: "", hourlyRate: "", availableDays: "", availableTimeFrom: "", availableTimeTo: "", sessionDurationMinutes: "60", maxStudents: "1", descriptionAr: "" });
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "فشل إنشاء الإعلان");
    }
  };

  const mySessions = (sessions as any[]).filter(() => true);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
    >
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.headerTitle}>لوحة تحكم المعلم</Text>
        <Text style={styles.headerSubtitle}>إدارة دوراتك وجلساتك</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{(courses as any[]).length}</Text>
          <Text style={styles.statLabel}>دوراتي</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{mySessions.length}</Text>
          <Text style={styles.statLabel}>جلسات مباشرة</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{(listings as any[]).length}</Text>
          <Text style={styles.statLabel}>إعلانات خصوصي</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={() => setCreateOpen(true)}>
            <View style={[styles.actionIcon, { backgroundColor: "#EFF6FF" }]}>
              <Feather name="video" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.actionLabel}>جلسة مباشرة</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => setCreateListingOpen(true)}>
            <View style={[styles.actionIcon, { backgroundColor: "#F0FDF4" }]}>
              <Feather name="users" size={22} color="#22C55E" />
            </View>
            <Text style={styles.actionLabel}>إعلان خصوصي</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => router.push("/(tabs)/courses")}>
            <View style={[styles.actionIcon, { backgroundColor: "#FFF7ED" }]}>
              <Feather name="book" size={22} color="#F97316" />
            </View>
            <Text style={styles.actionLabel}>إدارة الدورات</Text>
          </Pressable>
        </View>
      </View>

      {/* My Courses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>دوراتي</Text>
        {coursesLoading ? (
          <ActivityIndicator color={C.tint} />
        ) : (courses as any[]).length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="book-open" size={32} color={C.textMuted} />
            <Text style={styles.emptyText}>لا توجد دورات بعد</Text>
          </View>
        ) : (
          (courses as any[]).slice(0, 5).map((c: any) => (
            <Pressable key={c.id} style={styles.courseRow} onPress={() => router.push({ pathname: "/course/[id]", params: { id: c.id.toString() } })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.courseName} numberOfLines={1}>{c.titleAr || c.title}</Text>
                <Text style={styles.courseMeta}>{c.lessonCount} درس · {c.enrollmentCount} طالب</Text>
              </View>
              <Feather name="chevron-left" size={16} color={C.textMuted} />
            </Pressable>
          ))
        )}
      </View>

      {/* Recent Live Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الجلسات المباشرة</Text>
        {mySessions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="video-off" size={32} color={C.textMuted} />
            <Text style={styles.emptyText}>لا توجد جلسات</Text>
          </View>
        ) : (
          mySessions.slice(0, 3).map((s: any) => (
            <View key={s.id} style={styles.sessionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.courseName} numberOfLines={1}>{s.titleAr || s.title}</Text>
                <Text style={styles.courseMeta}>{new Date(s.scheduledAt).toLocaleDateString("ar-LY")}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: s.status === "live" ? "#FEE2E2" : "#EFF6FF" }]}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: s.status === "live" ? "#DC2626" : C.tint }}>{s.status === "live" ? "مباشر" : "قادم"}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Create Live Session Modal */}
      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>إنشاء جلسة مباشرة</Text>
            <Text style={styles.inputLabel}>العنوان (عربي) *</Text>
            <TextInput style={styles.input} value={form.titleAr} onChangeText={v => setForm(f => ({ ...f, titleAr: v }))} placeholder="عنوان الجلسة" textAlign="right" />
            <Text style={styles.inputLabel}>العنوان (إنجليزي)</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Session title" />
            <Text style={styles.inputLabel}>الوصف</Text>
            <TextInput style={[styles.input, { height: 70 }]} multiline value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="وصف الجلسة" textAlign="right" />
            <Text style={styles.inputLabel}>التاريخ والوقت *</Text>
            <TextInput style={styles.input} value={form.scheduledAt} onChangeText={v => setForm(f => ({ ...f, scheduledAt: v }))} placeholder="2026-04-01T18:00:00" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>المدة (دقيقة)</Text>
                <TextInput style={styles.input} value={form.durationMinutes} onChangeText={v => setForm(f => ({ ...f, durationMinutes: v }))} keyboardType="numeric" placeholder="90" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>الحد الأقصى للمشاركين</Text>
                <TextInput style={styles.input} value={form.maxParticipants} onChangeText={v => setForm(f => ({ ...f, maxParticipants: v }))} keyboardType="numeric" placeholder="50" />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Pressable style={[styles.applyBtn, { flex: 1 }]} onPress={createSession}>
                <Text style={styles.applyBtnText}>إنشاء الجلسة</Text>
              </Pressable>
              <Pressable style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setCreateOpen(false)}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Tutoring Listing Modal */}
      <Modal visible={createListingOpen} transparent animationType="slide" onRequestClose={() => setCreateListingOpen(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalBox, { maxHeight: "90%" }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>إنشاء إعلان دروس خصوصية</Text>

            <Text style={styles.inputLabel}>العنوان بالعربية *</Text>
            <TextInput style={styles.input} value={listingForm.titleAr} onChangeText={v => setListingForm(f => ({ ...f, titleAr: v }))} placeholder="مثال: دروس رياضيات - الثانوي" textAlign="right" />

            <Text style={styles.inputLabel}>المادة بالعربية *</Text>
            <TextInput style={styles.input} value={listingForm.subjectAr} onChangeText={v => setListingForm(f => ({ ...f, subjectAr: v }))} placeholder="مثال: الرياضيات" textAlign="right" />

            <Text style={styles.inputLabel}>Subject (English)</Text>
            <TextInput style={styles.input} value={listingForm.subject} onChangeText={v => setListingForm(f => ({ ...f, subject: v }))} placeholder="e.g. Mathematics" />

            <Text style={styles.inputLabel}>المستوى الدراسي</Text>
            <TextInput style={styles.input} value={listingForm.gradeLevel} onChangeText={v => setListingForm(f => ({ ...f, gradeLevel: v }))} placeholder="grade_10 / grade_11 / grade_12 / university" />

            <Text style={styles.inputLabel}>السعر بالساعة (دينار) *</Text>
            <TextInput style={styles.input} value={listingForm.hourlyRate} onChangeText={v => setListingForm(f => ({ ...f, hourlyRate: v }))} keyboardType="numeric" placeholder="50" />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>مدة الجلسة (دقيقة)</Text>
                <TextInput style={styles.input} value={listingForm.sessionDurationMinutes} onChangeText={v => setListingForm(f => ({ ...f, sessionDurationMinutes: v }))} keyboardType="numeric" placeholder="60" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>الحد الأقصى للطلاب</Text>
                <TextInput style={styles.input} value={listingForm.maxStudents} onChangeText={v => setListingForm(f => ({ ...f, maxStudents: v }))} keyboardType="numeric" placeholder="1" />
              </View>
            </View>

            <Text style={styles.inputLabel}>أيام التوفر (مثال: Mon,Tue,Wed)</Text>
            <TextInput style={styles.input} value={listingForm.availableDays} onChangeText={v => setListingForm(f => ({ ...f, availableDays: v }))} placeholder="Mon,Tue,Thu" />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>من الساعة</Text>
                <TextInput style={styles.input} value={listingForm.availableTimeFrom} onChangeText={v => setListingForm(f => ({ ...f, availableTimeFrom: v }))} placeholder="16:00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>حتى الساعة</Text>
                <TextInput style={styles.input} value={listingForm.availableTimeTo} onChangeText={v => setListingForm(f => ({ ...f, availableTimeTo: v }))} placeholder="21:00" />
              </View>
            </View>

            <Text style={styles.inputLabel}>وصف الدرس</Text>
            <TextInput style={[styles.input, { height: 70 }]} multiline value={listingForm.descriptionAr} onChangeText={v => setListingForm(f => ({ ...f, descriptionAr: v }))} placeholder="اكتب تفاصيل الدرس والمحتوى..." textAlign="right" />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16, marginBottom: 24 }}>
              <Pressable style={[styles.applyBtn, { flex: 1 }]} onPress={createListing}>
                <Text style={styles.applyBtnText}>إنشاء الإعلان</Text>
              </Pressable>
              <Pressable style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setCreateListingOpen(false)}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ── Student My Learning ───────────────────────────────────────────────────────

function StudentMyLearning() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ["enrollments"],
    queryFn: () => apiFetch("/enrollments"),
    enabled: !!user,
  });

  const active = enrollments?.filter(e => e.progress < 100) || [];
  const completed = enrollments?.filter(e => e.progress >= 100) || [];

  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPad }]}>
        <Feather name="book-open" size={48} color={C.tint} />
        <Text style={styles.guestTitle}>دوراتك تنتظرك!</Text>
        <Text style={styles.guestSubtitle}>سجّل دخولك لرؤية دوراتك المسجّلة</Text>
        <Pressable style={styles.loginBtn} onPress={() => router.push("/auth/login")}>
          <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>تعلّمي</Text>
        <Text style={styles.headerSubtitle}>استمر في رحلتك التعليمية</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.tint} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={[...active, ...completed]}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <EnrollmentCard item={item} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90, paddingTop: 8, gap: 12 }}
          ListHeaderComponent={() =>
            enrollments && enrollments.length > 0 ? (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{enrollments.length}</Text>
                  <Text style={styles.statLabel}>دورة مسجّلة</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{completed.length}</Text>
                  <Text style={styles.statLabel}>مكتملة</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{active.length}</Text>
                  <Text style={styles.statLabel}>جارية</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Feather name="book-open" size={48} color={C.textMuted} />
              <Text style={styles.emptyTitle}>لم تسجّل في أي دورة بعد</Text>
              <Text style={styles.emptySubtitle}>تصفّح الدورات المتاحة وابدأ التعلّم</Text>
              <Pressable style={styles.loginBtn} onPress={() => router.push("/courses" as any)}>
                <Text style={styles.loginBtnText}>تصفّح الدورات</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function MyLearningScreen() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  return isTeacher ? <TeacherDashboard /> : <StudentMyLearning />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  centered: { alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: "row", backgroundColor: C.card, marginHorizontal: 20, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 16 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, marginBottom: 4 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary, textAlign: "center" },
  statDivider: { width: 1, backgroundColor: C.cardBorder, marginVertical: 4 },
  card: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.cardBorder, gap: 12 },
  cardThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: C.pill, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, textAlign: "right", marginBottom: 2, lineHeight: 20 },
  cardTeacher: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, textAlign: "right", marginBottom: 6 },
  progressRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 4 },
  progressBar: { flex: 1, height: 5, backgroundColor: C.pill, borderRadius: 3 },
  progressFill: { height: 5, backgroundColor: C.tint, borderRadius: 3 },
  progressPct: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.tint, width: 32, textAlign: "right" },
  cardMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, textAlign: "right" },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.textMuted, textAlign: "right", marginBottom: 10 },
  actionsRow: { flexDirection: "row-reverse", gap: 12 },
  actionBtn: { flex: 1, alignItems: "center", gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.textSecondary, textAlign: "center" },
  courseRow: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 8, gap: 10 },
  courseName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, textAlign: "right" },
  courseMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, textAlign: "right" },
  sessionRow: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 8, gap: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  emptyBox: { alignItems: "center", paddingVertical: 24, gap: 8, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: C.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, textAlign: "center" },
  guestTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, textAlign: "center" },
  guestSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center", maxWidth: 260 },
  loginBtn: { backgroundColor: C.tint, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
  loginBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text, textAlign: "right", marginBottom: 14 },
  inputLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textSecondary, textAlign: "right", marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: C.pill, borderRadius: 12, padding: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.cardBorder },
  applyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.tint, borderRadius: 14, paddingVertical: 12 },
  applyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.pill, borderRadius: 14, paddingVertical: 12 },
  cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.textSecondary },
});
