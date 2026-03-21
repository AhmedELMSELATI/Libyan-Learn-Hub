import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
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

function MenuRow({ icon, label, onPress, danger = false, value }: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  value?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: C.backgroundSecondary }]}
      onPress={onPress}
    >
      <Feather name={icon as any} size={18} color={danger ? C.error : C.textSecondary} />
      <Text style={[styles.menuLabel, danger && { color: C.error }]}>{label}</Text>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {!danger && <Feather name="chevron-left" size={16} color={C.textMuted} />}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { apiFetch } = useApi();

  const { data: enrollments } = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => apiFetch("/enrollments"),
    enabled: !!user,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (!user) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPad }]}>
        <View style={styles.guestIcon}>
          <Feather name="user" size={40} color={C.tint} />
        </View>
        <Text style={styles.guestTitle}>أهلاً بك في EduLibya</Text>
        <Text style={styles.guestSubtitle}>سجّل دخولك للوصول إلى حسابك ودوراتك</Text>
        <Pressable style={styles.loginBtn} onPress={() => router.push("/auth/login")}>
          <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
        </Pressable>
        <Pressable style={styles.registerBtn} onPress={() => router.push("/auth/register")}>
          <Text style={styles.registerBtnText}>إنشاء حساب جديد</Text>
        </Pressable>
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد من تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: () => logout() },
    ]);
  };

  const roleName = user.role === "teacher" ? "معلم" : user.role === "admin" ? "مشرف" : "طالب";
  const enrolledCount = Array.isArray(enrollments) ? enrollments.length : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <View style={[styles.profileHeader, { paddingTop: topPad + 20 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.fullNameAr || user.fullName).charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user.fullNameAr || user.fullName}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleName}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{enrolledCount}</Text>
          <Text style={styles.statLabel}>دورة مسجّلة</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {Array.isArray(enrollments)
              ? enrollments.filter((e: any) => e.progress >= 100).length
              : 0}
          </Text>
          <Text style={styles.statLabel}>دورة مكتملة</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {Array.isArray(enrollments)
              ? Math.round(enrollments.reduce((acc: number, e: any) => acc + (e.progress || 0), 0) / Math.max(enrolledCount, 1))
              : 0}%
          </Text>
          <Text style={styles.statLabel}>متوسط التقدم</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الحساب</Text>
        <View style={styles.menuGroup}>
          <MenuRow
            icon="user"
            label="معلومات الحساب"
            value={user.role === "teacher" ? "معلم" : "طالب"}
            onPress={() => {}}
          />
          <View style={styles.menuSeparator} />
          <MenuRow
            icon="globe"
            label="اللغة"
            value={user.language === "ar" ? "العربية" : "English"}
            onPress={() => {}}
          />
        </View>
      </View>

      {user.role === "teacher" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إدارة المحتوى</Text>
          <View style={styles.menuGroup}>
            <MenuRow icon="book" label="دوراتي" onPress={() => router.push("/courses")} />
            <View style={styles.menuSeparator} />
            <MenuRow icon="users" label="الطلاب" onPress={() => {}} />
            <View style={styles.menuSeparator} />
            <MenuRow icon="video" label="جلساتي المباشرة" onPress={() => router.push("/live")} />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>عام</Text>
        <View style={styles.menuGroup}>
          <MenuRow icon="help-circle" label="المساعدة والدعم" onPress={() => {}} />
          <View style={styles.menuSeparator} />
          <MenuRow icon="info" label="عن التطبيق" onPress={() => {}} />
          <View style={styles.menuSeparator} />
          <MenuRow icon="shield" label="سياسة الخصوصية" onPress={() => {}} />
        </View>
      </View>

      <View style={[styles.section, { marginTop: 8 }]}>
        <View style={styles.menuGroup}>
          <MenuRow icon="log-out" label="تسجيل الخروج" onPress={handleLogout} danger />
        </View>
      </View>

      <Text style={styles.version}>EduLibya v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.backgroundSecondary },
  centered: { alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 32, color: "#fff" },
  userName: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text, marginBottom: 4 },
  userEmail: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, marginBottom: 10 },
  roleBadge: {
    backgroundColor: C.pill,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.tint },
  statsRow: {
    flexDirection: "row",
    backgroundColor: C.background,
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, marginBottom: 4 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary, textAlign: "center" },
  statDivider: { width: 1, backgroundColor: C.cardBorder, marginVertical: 4 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textMuted, marginBottom: 10, textAlign: "right" },
  menuGroup: {
    backgroundColor: C.background,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  menuRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuLabel: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: C.text, textAlign: "right" },
  menuRight: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  menuValue: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textMuted },
  menuSeparator: { height: 1, backgroundColor: C.cardBorder, marginRight: 16 },
  guestIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  guestTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, textAlign: "center" },
  guestSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center", maxWidth: 260, lineHeight: 20 },
  loginBtn: { backgroundColor: C.tint, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14, width: "100%", marginTop: 8 },
  loginBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff", textAlign: "center" },
  registerBtn: { borderWidth: 1.5, borderColor: C.tint, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14, width: "100%" },
  registerBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.tint, textAlign: "center" },
  version: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted, textAlign: "center", marginTop: 24, marginBottom: 8 },
});
