import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
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

interface Course {
  id: number;
  title: string;
  titleAr: string;
  teacherName: string;
  price: number;
  currency: string;
  rating: number;
  enrollmentCount: number;
  level: string;
  language: string;
  thumbnailUrl?: string | null;
  lessonCount: number;
}

interface Category {
  id: number;
  name: string;
  nameAr: string;
  icon?: string | null;
  courseCount: number;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather
          key={i}
          name="star"
          size={10}
          color={i <= Math.round(rating) ? C.star : C.textMuted}
        />
      ))}
      <Text style={styles.ratingText}>{rating > 0 ? rating.toFixed(1) : "جديد"}</Text>
    </View>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.courseCard, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: "/course/[id]", params: { id: course.id.toString() } })}
    >
      <View style={styles.courseThumb}>
        {course.thumbnailUrl ? (
          <Image source={{ uri: course.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
            <Feather name="book-open" size={28} color={C.tint} />
          </View>
        )}
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>
            {course.level === "beginner" ? "مبتدئ" : course.level === "intermediate" ? "متوسط" : "متقدم"}
          </Text>
        </View>
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitleCard} numberOfLines={2}>{course.titleAr || course.title}</Text>
        <Text style={styles.courseTeacher}>{course.teacherName}</Text>
        <StarRow rating={course.rating} />
        <View style={styles.courseFooter}>
          <Text style={styles.coursePrice}>
            {course.price === 0 ? "مجاني" : `${course.price} ${course.currency}`}
          </Text>
          <Text style={styles.lessonCount}>{course.lessonCount} درس</Text>
        </View>
      </View>
    </Pressable>
  );
}

function CategoryChip({ cat, onPress }: { cat: Category; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.categoryChip, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <Text style={styles.categoryIcon}>{cat.icon || "📚"}</Text>
      <Text style={styles.categoryName}>{cat.nameAr}</Text>
      <Text style={styles.categoryCount}>{cat.courseCount}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { apiFetch } = useApi();

  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ["courses-featured"],
    queryFn: () => apiFetch("/courses?limit=6"),
  });

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch("/categories"),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "صباح الخير";
    if (h < 18) return "مساء الخير";
    return "مساء النور";
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.userName}>{user?.fullNameAr || user?.fullName || "مرحباً بك"}</Text>
        </View>
        <Pressable
          style={styles.searchBtn}
          onPress={() => router.push("/courses")}
        >
          <Feather name="search" size={20} color={C.textSecondary} />
        </Pressable>
      </View>

      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTag}>منصة التعلم الليبية</Text>
          <Text style={styles.heroTitle}>ابدأ رحلة{"\n"}التعلم اليوم</Text>
          <Pressable
            style={styles.heroBtn}
            onPress={() => router.push("/courses")}
          >
            <Text style={styles.heroBtnText}>استكشف الدورات</Text>
            <Feather name="arrow-left" size={16} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.heroIllustration}>
          <Feather name="book-open" size={60} color="rgba(255,255,255,0.3)" />
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>التخصصات</Text>
          <Pressable onPress={() => router.push("/courses")}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </Pressable>
        </View>
        {loadingCats ? (
          <ActivityIndicator color={C.tint} style={{ marginVertical: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
            {(categories as Category[] || []).slice(0, 8).map((cat) => (
              <CategoryChip key={cat.id} cat={cat} onPress={() => router.push("/courses")} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Featured Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>دورات مميزة</Text>
          <Pressable onPress={() => router.push("/courses")}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </Pressable>
        </View>
        {loadingCourses ? (
          <ActivityIndicator color={C.tint} style={{ marginVertical: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}>
            {(coursesData?.courses as Course[] || []).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* CTA for guest */}
      {!user && (
        <View style={styles.ctaBox}>
          <Feather name="award" size={32} color={C.tint} />
          <Text style={styles.ctaTitle}>انضم إلى EduLibya</Text>
          <Text style={styles.ctaSubtitle}>سجّل مجاناً وابدأ التعلم مع أفضل المعلمين الليبيين</Text>
          <Pressable style={styles.ctaBtn} onPress={() => router.push("/auth/register")}>
            <Text style={styles.ctaBtnText}>إنشاء حساب مجاني</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/auth/login")}>
            <Text style={styles.ctaLogin}>لدي حساب بالفعل</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  userName: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text, marginTop: 2 },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  heroBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: C.tint,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  heroContent: { flex: 1 },
  heroTag: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
    overflow: "hidden",
  },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#fff", lineHeight: 30, marginBottom: 16 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  heroIllustration: { opacity: 0.4, marginLeft: 12 },
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: C.text },
  seeAll: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.tint },
  categoryChip: {
    alignItems: "center",
    backgroundColor: C.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    width: 90,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  categoryIcon: { fontSize: 24, marginBottom: 6 },
  categoryName: { fontFamily: "Inter_500Medium", fontSize: 11, color: C.text, textAlign: "center" },
  categoryCount: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textMuted, marginTop: 2 },
  courseCard: {
    width: 200,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  courseThumb: {
    height: 110,
    backgroundColor: C.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: C.pill },
  levelBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelBadgeText: { fontFamily: "Inter_500Medium", fontSize: 10, color: "#fff" },
  courseInfo: { padding: 12 },
  courseTitleCard: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.text, marginBottom: 4, lineHeight: 18 },
  courseTeacher: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary, marginBottom: 6 },
  ratingText: { fontFamily: "Inter_500Medium", fontSize: 10, color: C.textSecondary, marginLeft: 4 },
  courseFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  coursePrice: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.tint },
  lessonCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textMuted },
  ctaBox: {
    margin: 20,
    backgroundColor: C.backgroundSecondary,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  ctaTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.text, marginTop: 12, marginBottom: 8 },
  ctaSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  ctaBtn: { backgroundColor: C.tint, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, width: "100%" },
  ctaBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff", textAlign: "center" },
  ctaLogin: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.tint, marginTop: 14 },
});
