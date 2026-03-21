import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
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
        <Text style={styles.cardMeta}>{item.course.lessonCount} درس • {item.course.totalDuration} دقيقة</Text>
      </View>
      <Pressable
        style={styles.continueBtn}
        onPress={(e) => {
          e.stopPropagation();
          router.push({ pathname: "/course/[id]", params: { id: item.courseId.toString() } });
        }}
      >
        <Feather name="play" size={14} color="#fff" />
      </Pressable>
    </Pressable>
  );
}

export default function MyLearningScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { apiFetch } = useApi();

  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ["enrollments"],
    queryFn: () => apiFetch("/enrollments"),
    enabled: !!user,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Feather name="lock" size={48} color={C.textMuted} />
        <Text style={styles.authTitle}>سجّل دخولك للمتابعة</Text>
        <Text style={styles.authSubtitle}>تحتاج إلى حساب لعرض دوراتك</Text>
        <Pressable style={styles.authBtn} onPress={() => router.push("/auth/login")}>
          <Text style={styles.authBtnText}>تسجيل الدخول</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.headerTitle}>تعلمي</Text>
        <Text style={styles.headerSubtitle}>{enrollments?.length || 0} دورة مسجّلة</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.tint} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={enrollments || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <EnrollmentCard item={item} />}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90,
            paddingTop: 8,
            gap: 12,
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Feather name="book" size={48} color={C.textMuted} />
              <Text style={styles.emptyTitle}>لم تسجّل في أي دورة بعد</Text>
              <Text style={styles.emptySubtitle}>استعرض الدورات المتاحة وابدأ رحلة التعلم</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push("/courses")}>
                <Text style={styles.emptyBtnText}>استعرض الدورات</Text>
              </Pressable>
            </View>
          )}
          scrollEnabled={!!(enrollments?.length ?? 0)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  centered: { alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 4 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  cardThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: C.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, marginBottom: 3, textAlign: "right" },
  cardTeacher: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary, marginBottom: 8, textAlign: "right" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  progressBar: { flex: 1, height: 4, backgroundColor: C.backgroundTertiary, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: C.tint, borderRadius: 2 },
  progressPct: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.tint, minWidth: 30 },
  cardMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted, textAlign: "right" },
  continueBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  authTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text, textAlign: "center" },
  authSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center" },
  authBtn: { backgroundColor: C.tint, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  authBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: C.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, textAlign: "center", maxWidth: 260 },
  emptyBtn: { backgroundColor: C.tint, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
});
