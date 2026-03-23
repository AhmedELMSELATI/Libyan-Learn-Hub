import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";

const C = Colors.light;

export default function ManageCourseScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string }>();
  const courseId = params.id;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Modals
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [editSectionTarget, setEditSectionTarget] = useState<any>(null);
  const [addLessonSectionId, setAddLessonSectionId] = useState<number | null>(null);
  const [editLessonTarget, setEditLessonTarget] = useState<any>(null);

  // Forms
  const [sectionForm, setSectionForm] = useState({ title: "", titleAr: "", description: "", descriptionAr: "" });
  const [lessonForm, setLessonForm] = useState({ title: "", titleAr: "", videoUrl: "", content: "", contentAr: "", duration: "0", isFree: false, type: "video" });

  // Expanded
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data: course, isLoading: courseLoading } = useQuery<any>({
    queryKey: ["course-detail", courseId],
    queryFn: () => apiFetch(`/courses/${courseId}`),
    enabled: !!courseId,
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery<any[]>({
    queryKey: ["course-sections", courseId],
    queryFn: async () => {
      const res = await apiFetch(`/courses/${courseId}/sections`);
      // Auto-expand all sections
      setExpanded(new Set((res || []).map((s: any) => s.id)));
      return res;
    },
    enabled: !!courseId,
  });

  const enrollCount = course?.enrollmentCount || 0;
  const canDelete = enrollCount === 0;

  // ── Section CRUD ──────────────────────────────────────────────
  const handleAddSection = async () => {
    if (!sectionForm.title || !sectionForm.titleAr) {
      Alert.alert("خطأ", "يرجى ملء عنوان القسم بالعربي والإنجليزي");
      return;
    }
    try {
      await apiFetch(`/courses/${courseId}/sections`, {
        method: "POST",
        body: JSON.stringify({ ...sectionForm, order: sections.length }),
      });
      Alert.alert("تم!", "تمت إضافة القسم.");
      queryClient.invalidateQueries({ queryKey: ["course-sections", courseId] });
      setAddSectionOpen(false);
      setSectionForm({ title: "", titleAr: "", description: "", descriptionAr: "" });
    } catch (err: any) {
      Alert.alert("خطأ", err.message);
    }
  };

  const handleEditSection = async () => {
    if (!editSectionTarget) return;
    try {
      await apiFetch(`/courses/${courseId}/sections/${editSectionTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...sectionForm, order: editSectionTarget.order }),
      });
      Alert.alert("تم!", "تم تحديث القسم.");
      queryClient.invalidateQueries({ queryKey: ["course-sections", courseId] });
      setEditSectionTarget(null);
    } catch (err: any) {
      Alert.alert("خطأ", err.message);
    }
  };

  const handleDeleteSection = (section: any) => {
    if (!canDelete) {
      Alert.alert("غير مسموح", "لا يمكن حذف القسم — يوجد طلاب مسجلون في هذه الدورة.");
      return;
    }
    Alert.alert("حذف القسم", `هل تريد حذف "${section.titleAr}"؟ سيتم حذف جميع الدروس بداخله.`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف", style: "destructive", onPress: async () => {
          try {
            await apiFetch(`/courses/${courseId}/sections/${section.id}`, { method: "DELETE" });
            queryClient.invalidateQueries({ queryKey: ["course-sections", courseId] });
          } catch (err: any) { Alert.alert("خطأ", err.message); }
        },
      },
    ]);
  };

  // ── Lesson CRUD ───────────────────────────────────────────────
  const handleAddLesson = async () => {
    if (!addLessonSectionId || !lessonForm.title || !lessonForm.titleAr) {
      Alert.alert("خطأ", "يرجى ملء عنوان الدرس");
      return;
    }
    const sectionLessons = sections.find(s => s.id === addLessonSectionId)?.lessons || [];
    try {
      await apiFetch(`/courses/${courseId}/sections/${addLessonSectionId}/lessons`, {
        method: "POST",
        body: JSON.stringify({
          ...lessonForm,
          duration: parseInt(lessonForm.duration) || 0,
          order: sectionLessons.length,
          isFree: lessonForm.isFree,
        }),
      });
      Alert.alert("تم!", "تمت إضافة الدرس.");
      queryClient.invalidateQueries({ queryKey: ["course-sections", courseId] });
      setAddLessonSectionId(null);
      setLessonForm({ title: "", titleAr: "", videoUrl: "", content: "", contentAr: "", duration: "0", isFree: false, type: "video" });
    } catch (err: any) {
      Alert.alert("خطأ", err.message);
    }
  };

  const handleEditLesson = async () => {
    if (!editLessonTarget) return;
    try {
      await apiFetch(`/courses/${courseId}/lessons/${editLessonTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...lessonForm,
          duration: parseInt(lessonForm.duration) || 0,
          order: editLessonTarget.order,
          isFree: lessonForm.isFree,
        }),
      });
      Alert.alert("تم!", "تم تحديث الدرس.");
      queryClient.invalidateQueries({ queryKey: ["course-sections", courseId] });
      setEditLessonTarget(null);
    } catch (err: any) {
      Alert.alert("خطأ", err.message);
    }
  };

  const handleDeleteLesson = (lesson: any) => {
    if (!canDelete) {
      Alert.alert("غير مسموح", "لا يمكن حذف الدرس — يوجد طلاب مسجلون.");
      return;
    }
    Alert.alert("حذف الدرس", `هل تريد حذف "${lesson.titleAr}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف", style: "destructive", onPress: async () => {
          try {
            await apiFetch(`/courses/${courseId}/lessons/${lesson.id}`, { method: "DELETE" });
            queryClient.invalidateQueries({ queryKey: ["course-sections", courseId] });
          } catch (err: any) { Alert.alert("خطأ", err.message); }
        },
      },
    ]);
  };

  const handlePublishToggle = async () => {
    if (!course) return;
    try {
      await apiFetch(`/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: course.title, titleAr: course.titleAr,
          description: course.description, descriptionAr: course.descriptionAr,
          price: course.price, level: course.level, language: course.language,
          categoryId: course.categoryId, isPublished: !course.isPublished,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["course-detail", courseId] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      Alert.alert("تم!", course.isPublished ? "تم إلغاء نشر الدورة" : "تم نشر الدورة بنجاح!");
    } catch (err: any) {
      Alert.alert("خطأ", err.message);
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length || 0), 0);

  if (courseLoading || sectionsLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad + 16 }]}>
        <ActivityIndicator color={C.tint} style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={20} color={C.text} />
          <Text style={styles.backText}>رجوع</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={2}>{course?.titleAr || course?.title}</Text>
        <Text style={styles.headerSubtitle}>{course?.title}</Text>

        {/* Course stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{sections.length}</Text>
            <Text style={styles.statLabel}>أقسام</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalLessons}</Text>
            <Text style={styles.statLabel}>دروس</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{enrollCount}</Text>
            <Text style={styles.statLabel}>طلاب</Text>
          </View>
        </View>

        {/* Publish & Add Section buttons */}
        <View style={{ flexDirection: "row-reverse", gap: 10, marginTop: 16 }}>
          <Pressable
            style={[styles.primaryBtn, course?.isPublished && { backgroundColor: "#F97316" }]}
            onPress={handlePublishToggle}
          >
            <Feather name={course?.isPublished ? "eye-off" : "check-circle"} size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>{course?.isPublished ? "إلغاء النشر" : "نشر الدورة"}</Text>
          </Pressable>
          <Pressable style={styles.outlineBtn} onPress={() => {
            setSectionForm({ title: "", titleAr: "", description: "", descriptionAr: "" });
            setAddSectionOpen(true);
          }}>
            <Feather name="plus" size={16} color={C.tint} />
            <Text style={[styles.primaryBtnText, { color: C.tint }]}>إضافة قسم</Text>
          </Pressable>
        </View>
      </View>

      {/* Enrollment warning */}
      {!canDelete && (
        <View style={styles.warningBar}>
          <Feather name="alert-triangle" size={16} color="#92400E" />
          <Text style={styles.warningText}>يوجد {enrollCount} طالب مسجل — لا يمكن حذف المحتوى</Text>
        </View>
      )}

      {/* Empty state */}
      {sections.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="folder" size={48} color={C.textMuted} />
          <Text style={styles.emptyTitle}>لا توجد أقسام بعد</Text>
          <Text style={styles.emptySubtitle}>أنشئ أول قسم لتنظيم محتوى دورتك</Text>
          <Pressable style={[styles.primaryBtn, { marginTop: 12 }]} onPress={() => setAddSectionOpen(true)}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>إضافة أول قسم</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ padding: 20, gap: 14 }}>
          {sections.map((section, sIdx) => {
            const isOpen = expanded.has(section.id);
            const lessons = section.lessons || [];
            return (
              <View key={section.id} style={styles.sectionCard}>
                {/* Section header */}
                <Pressable style={styles.sectionHeader} onPress={() => toggleExpand(section.id)}>
                  <Feather name={isOpen ? "chevron-down" : "chevron-left"} size={18} color={C.textMuted} />
                  <View style={styles.sectionNum}>
                    <Text style={styles.sectionNumText}>{sIdx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>{section.titleAr || section.title}</Text>
                    <Text style={styles.sectionMeta}>{lessons.length} درس</Text>
                  </View>
                  <Pressable style={styles.iconBtn} onPress={() => {
                    setEditSectionTarget(section);
                    setSectionForm({
                      title: section.title || "", titleAr: section.titleAr || "",
                      description: section.description || "", descriptionAr: section.descriptionAr || "",
                    });
                  }}>
                    <Feather name="edit-2" size={14} color={C.textMuted} />
                  </Pressable>
                  {canDelete && (
                    <Pressable style={styles.iconBtn} onPress={() => handleDeleteSection(section)}>
                      <Feather name="trash-2" size={14} color="#EF4444" />
                    </Pressable>
                  )}
                </Pressable>

                {/* Lessons list */}
                {isOpen && (
                  <View style={styles.lessonsList}>
                    {lessons.length === 0 ? (
                      <Text style={styles.noLessonsText}>لا توجد دروس في هذا القسم</Text>
                    ) : (
                      lessons.map((lesson: any, lIdx: number) => (
                        <View key={lesson.id} style={styles.lessonRow}>
                          <View style={styles.lessonIcon}>
                            <Feather name={lesson.type === "video" ? "play-circle" : "file-text"} size={14} color={C.tint} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.lessonTitle}>{lesson.titleAr || lesson.title}</Text>
                            {lesson.isFree && <Text style={styles.freeBadge}>مجاني</Text>}
                          </View>
                          <Pressable style={styles.iconBtn} onPress={() => {
                            setEditLessonTarget(lesson);
                            setLessonForm({
                              title: lesson.title || "", titleAr: lesson.titleAr || "",
                              videoUrl: lesson.videoUrl || "", content: lesson.content || "",
                              contentAr: lesson.contentAr || "", duration: (lesson.duration || 0).toString(),
                              isFree: lesson.isFree, type: lesson.type || "video",
                            });
                          }}>
                            <Feather name="edit-2" size={12} color={C.textMuted} />
                          </Pressable>
                          {canDelete && (
                            <Pressable style={styles.iconBtn} onPress={() => handleDeleteLesson(lesson)}>
                              <Feather name="trash-2" size={12} color="#EF4444" />
                            </Pressable>
                          )}
                        </View>
                      ))
                    )}
                    <Pressable style={styles.addLessonBtn} onPress={() => {
                      setAddLessonSectionId(section.id);
                      setLessonForm({ title: "", titleAr: "", videoUrl: "", content: "", contentAr: "", duration: "0", isFree: false, type: "video" });
                    }}>
                      <Feather name="plus" size={14} color={C.tint} />
                      <Text style={styles.addLessonText}>إضافة درس</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ── Add Section Modal ──────────────────────────────────── */}
      <Modal visible={addSectionOpen} transparent animationType="slide" onRequestClose={() => setAddSectionOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>إضافة قسم جديد</Text>
            <Text style={styles.inputLabel}>عنوان القسم (عربي) *</Text>
            <TextInput style={styles.input} value={sectionForm.titleAr} onChangeText={v => setSectionForm(f => ({ ...f, titleAr: v }))} placeholder="مثال: المقدمة" textAlign="right" />
            <Text style={styles.inputLabel}>Section Title (EN) *</Text>
            <TextInput style={styles.input} value={sectionForm.title} onChangeText={v => setSectionForm(f => ({ ...f, title: v }))} placeholder="e.g. Introduction" />
            <Text style={styles.inputLabel}>الوصف (اختياري)</Text>
            <TextInput style={[styles.input, { height: 60 }]} multiline value={sectionForm.descriptionAr} onChangeText={v => setSectionForm(f => ({ ...f, descriptionAr: v }))} placeholder="وصف القسم" textAlign="right" />
            <View style={styles.modalBtns}>
              <Pressable style={[styles.primaryBtn, { flex: 1 }]} onPress={handleAddSection}>
                <Text style={styles.primaryBtnText}>إضافة</Text>
              </Pressable>
              <Pressable style={[styles.outlineBtn, { flex: 1 }]} onPress={() => setAddSectionOpen(false)}>
                <Text style={[styles.primaryBtnText, { color: C.textSecondary }]}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Section Modal ─────────────────────────────────── */}
      <Modal visible={!!editSectionTarget} transparent animationType="slide" onRequestClose={() => setEditSectionTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>تعديل القسم</Text>
            <Text style={styles.inputLabel}>عنوان القسم (عربي) *</Text>
            <TextInput style={styles.input} value={sectionForm.titleAr} onChangeText={v => setSectionForm(f => ({ ...f, titleAr: v }))} textAlign="right" />
            <Text style={styles.inputLabel}>Section Title (EN) *</Text>
            <TextInput style={styles.input} value={sectionForm.title} onChangeText={v => setSectionForm(f => ({ ...f, title: v }))} />
            <Text style={styles.inputLabel}>الوصف</Text>
            <TextInput style={[styles.input, { height: 60 }]} multiline value={sectionForm.descriptionAr} onChangeText={v => setSectionForm(f => ({ ...f, descriptionAr: v }))} textAlign="right" />
            <View style={styles.modalBtns}>
              <Pressable style={[styles.primaryBtn, { flex: 1 }]} onPress={handleEditSection}>
                <Text style={styles.primaryBtnText}>حفظ</Text>
              </Pressable>
              <Pressable style={[styles.outlineBtn, { flex: 1 }]} onPress={() => setEditSectionTarget(null)}>
                <Text style={[styles.primaryBtnText, { color: C.textSecondary }]}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Lesson Modal ───────────────────────────────────── */}
      <Modal visible={!!addLessonSectionId} transparent animationType="slide" onRequestClose={() => setAddLessonSectionId(null)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalBox, { maxHeight: "85%" }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>إضافة درس جديد</Text>
            <Text style={styles.inputLabel}>عنوان الدرس (عربي) *</Text>
            <TextInput style={styles.input} value={lessonForm.titleAr} onChangeText={v => setLessonForm(f => ({ ...f, titleAr: v }))} placeholder="مثال: ما هو الجبر؟" textAlign="right" />
            <Text style={styles.inputLabel}>Lesson Title (EN) *</Text>
            <TextInput style={styles.input} value={lessonForm.title} onChangeText={v => setLessonForm(f => ({ ...f, title: v }))} placeholder="e.g. What is Algebra?" />
            <Text style={styles.inputLabel}>نوع الدرس</Text>
            <View style={{ flexDirection: "row-reverse", gap: 8, marginBottom: 10 }}>
              {(["video", "text"] as const).map(t => (
                <Pressable
                  key={t}
                  style={[styles.typeChip, lessonForm.type === t && styles.typeChipActive]}
                  onPress={() => setLessonForm(f => ({ ...f, type: t }))}
                >
                  <Feather name={t === "video" ? "play-circle" : "file-text"} size={14} color={lessonForm.type === t ? "#fff" : C.textSecondary} />
                  <Text style={[styles.typeChipText, lessonForm.type === t && { color: "#fff" }]}>{t === "video" ? "فيديو" : "نص"}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.inputLabel}>رابط الفيديو</Text>
            <TextInput style={styles.input} value={lessonForm.videoUrl} onChangeText={v => setLessonForm(f => ({ ...f, videoUrl: v }))} placeholder="https://youtube.com/..." />
            <Text style={styles.inputLabel}>المحتوى / الملاحظات</Text>
            <TextInput style={[styles.input, { height: 60 }]} multiline value={lessonForm.contentAr} onChangeText={v => setLessonForm(f => ({ ...f, contentAr: v }))} placeholder="ملاحظات إضافية..." textAlign="right" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>المدة (ثواني)</Text>
                <TextInput style={styles.input} value={lessonForm.duration} onChangeText={v => setLessonForm(f => ({ ...f, duration: v }))} keyboardType="numeric" placeholder="600" />
              </View>
              <Pressable style={{ flex: 1, justifyContent: "flex-end" }} onPress={() => setLessonForm(f => ({ ...f, isFree: !f.isFree }))}>
                <View style={[styles.freeToggle, lessonForm.isFree && styles.freeToggleActive]}>
                  <Feather name={lessonForm.isFree ? "check-square" : "square"} size={16} color={lessonForm.isFree ? C.tint : C.textMuted} />
                  <Text style={[styles.freeToggleText, lessonForm.isFree && { color: C.tint }]}>معاينة مجانية</Text>
                </View>
              </Pressable>
            </View>
            <View style={[styles.modalBtns, { marginBottom: 24 }]}>
              <Pressable style={[styles.primaryBtn, { flex: 1 }]} onPress={handleAddLesson}>
                <Text style={styles.primaryBtnText}>إضافة الدرس</Text>
              </Pressable>
              <Pressable style={[styles.outlineBtn, { flex: 1 }]} onPress={() => setAddLessonSectionId(null)}>
                <Text style={[styles.primaryBtnText, { color: C.textSecondary }]}>إلغاء</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Edit Lesson Modal ──────────────────────────────────── */}
      <Modal visible={!!editLessonTarget} transparent animationType="slide" onRequestClose={() => setEditLessonTarget(null)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalBox, { maxHeight: "85%" }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>تعديل الدرس</Text>
            <Text style={styles.inputLabel}>عنوان الدرس (عربي) *</Text>
            <TextInput style={styles.input} value={lessonForm.titleAr} onChangeText={v => setLessonForm(f => ({ ...f, titleAr: v }))} textAlign="right" />
            <Text style={styles.inputLabel}>Lesson Title (EN) *</Text>
            <TextInput style={styles.input} value={lessonForm.title} onChangeText={v => setLessonForm(f => ({ ...f, title: v }))} />
            <Text style={styles.inputLabel}>رابط الفيديو</Text>
            <TextInput style={styles.input} value={lessonForm.videoUrl} onChangeText={v => setLessonForm(f => ({ ...f, videoUrl: v }))} />
            <Text style={styles.inputLabel}>المحتوى / الملاحظات</Text>
            <TextInput style={[styles.input, { height: 60 }]} multiline value={lessonForm.contentAr} onChangeText={v => setLessonForm(f => ({ ...f, contentAr: v }))} textAlign="right" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>المدة (ثواني)</Text>
                <TextInput style={styles.input} value={lessonForm.duration} onChangeText={v => setLessonForm(f => ({ ...f, duration: v }))} keyboardType="numeric" />
              </View>
              <Pressable style={{ flex: 1, justifyContent: "flex-end" }} onPress={() => setLessonForm(f => ({ ...f, isFree: !f.isFree }))}>
                <View style={[styles.freeToggle, lessonForm.isFree && styles.freeToggleActive]}>
                  <Feather name={lessonForm.isFree ? "check-square" : "square"} size={16} color={lessonForm.isFree ? C.tint : C.textMuted} />
                  <Text style={[styles.freeToggleText, lessonForm.isFree && { color: C.tint }]}>معاينة مجانية</Text>
                </View>
              </Pressable>
            </View>
            <View style={[styles.modalBtns, { marginBottom: 24 }]}>
              <Pressable style={[styles.primaryBtn, { flex: 1 }]} onPress={handleEditLesson}>
                <Text style={styles.primaryBtnText}>حفظ التعديلات</Text>
              </Pressable>
              <Pressable style={[styles.outlineBtn, { flex: 1 }]} onPress={() => setEditLessonTarget(null)}>
                <Text style={[styles.primaryBtnText, { color: C.textSecondary }]}>إلغاء</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { flexDirection: "row-reverse", alignItems: "center", gap: 6, marginBottom: 12 },
  backText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.text, textAlign: "right", lineHeight: 32 },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: "row-reverse", backgroundColor: C.card, borderRadius: 16, padding: 14, marginTop: 14, borderWidth: 1, borderColor: C.cardBorder },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.tint },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: C.cardBorder, marginHorizontal: 8 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: C.tint, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  primaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  outlineBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1.5, borderColor: C.tint },
  warningBar: { flexDirection: "row-reverse", alignItems: "center", gap: 8, backgroundColor: "#FFFBEB", marginHorizontal: 20, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#FCD34D" },
  warningText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "#92400E", flex: 1, textAlign: "right" },
  emptyBox: { alignItems: "center", marginTop: 40, gap: 8 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: C.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  sectionCard: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden" },
  sectionHeader: { flexDirection: "row-reverse", alignItems: "center", padding: 14, gap: 10 },
  sectionNum: { width: 30, height: 30, borderRadius: 10, backgroundColor: `${C.tint}15`, alignItems: "center", justifyContent: "center" },
  sectionNumText: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.tint },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.text, textAlign: "right" },
  sectionMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, textAlign: "right" },
  iconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  lessonsList: { borderTopWidth: 1, borderTopColor: C.cardBorder, padding: 14, gap: 8 },
  noLessonsText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted, textAlign: "center", paddingVertical: 12 },
  lessonRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: `${C.tint}08`, borderRadius: 12, padding: 10 },
  lessonIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: `${C.tint}15`, alignItems: "center", justifyContent: "center" },
  lessonTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.text, textAlign: "right" },
  freeBadge: { fontFamily: "Inter_500Medium", fontSize: 10, color: "#3B82F6", backgroundColor: "#EFF6FF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-end", marginTop: 2 },
  addLessonBtn: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: C.tint, borderStyle: "dashed", borderRadius: 12, paddingVertical: 10 },
  addLessonText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.tint },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text, textAlign: "right", marginBottom: 14 },
  inputLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textSecondary, textAlign: "right", marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: C.pill, borderRadius: 12, padding: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 4 },
  modalBtns: { flexDirection: "row-reverse", gap: 10, marginTop: 16 },
  typeChip: { flex: 1, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: C.pill },
  typeChipActive: { backgroundColor: C.tint },
  typeChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textSecondary },
  freeToggle: { flexDirection: "row-reverse", alignItems: "center", gap: 6, padding: 12, borderRadius: 12, backgroundColor: C.pill },
  freeToggleActive: { backgroundColor: `${C.tint}10` },
  freeToggleText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textMuted },
});
