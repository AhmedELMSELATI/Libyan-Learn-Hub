import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { ReportModal } from "@/components/ReportModal";

const C = Colors.light;

interface LiveSession {
  id: number;
  title: string;
  titleAr: string;
  teacherName: string;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants: number;
  participantCount: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  meetingUrl?: string | null;
  description?: string | null;
}

function statusLabel(s: string) {
  if (s === "live") return "مباشر الآن";
  if (s === "scheduled") return "قادم";
  if (s === "ended") return "منتهي";
  return "ملغي";
}

function statusColor(s: string) {
  if (s === "live") return "#EF4444";
  if (s === "scheduled") return C.tint;
  return C.textMuted;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-LY", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" });
}

function InAppVideoModal({ url, title, visible, onClose }: { url: string; title: string; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={styles.videoHeader}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.videoTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView
          source={{ uri: url }}
          style={{ flex: 1 }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/91.0.4472.164 Mobile Safari/537.36"
          onError={() => {}}
        />
      </SafeAreaView>
    </Modal>
  );
}

function SessionCard({ session, onJoin }: { session: LiveSession; onJoin: (s: LiveSession) => void }) {
  const isLive = session.status === "live";
  const isUpcoming = session.status === "scheduled";
  const canJoin = (isLive || isUpcoming) && !!session.meetingUrl;
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <View style={[styles.card, isLive && styles.cardLive]}>
      {isLive && (
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>مباشر الآن</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor(session.status)}15` }]}>
          <Text style={[styles.statusText, { color: statusColor(session.status) }]}>
            {statusLabel(session.status)}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Pressable onPress={() => setReportOpen(true)} style={{ marginLeft: 8, padding: 4 }}>
            <Feather name="flag" size={14} color={C.textMuted} />
          </Pressable>
          <Text style={styles.sessionTitle} numberOfLines={2}>{session.titleAr || session.title}</Text>
        </View>
      </View>

      <View style={styles.teacherRow}>
        <View style={styles.teacherAvatar}>
          <Feather name="user" size={14} color={C.tint} />
        </View>
        <Text style={styles.teacherName}>{session.teacherName}</Text>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={13} color={C.textMuted} />
          <Text style={styles.metaText}>{formatDate(session.scheduledAt)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="clock" size={13} color={C.textMuted} />
          <Text style={styles.metaText}>{formatTime(session.scheduledAt)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="activity" size={13} color={C.textMuted} />
          <Text style={styles.metaText}>{session.durationMinutes} دقيقة</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="users" size={13} color={C.textMuted} />
          <Text style={styles.metaText}>{session.maxParticipants} مشارك كحد أقصى</Text>
        </View>
      </View>

      {session.description && (
        <Text style={styles.description} numberOfLines={2}>{session.description}</Text>
      )}

      {canJoin && (
        <Pressable
          style={({ pressed }) => [styles.joinBtn, isLive && styles.joinBtnLive, pressed && { opacity: 0.85 }]}
          onPress={() => onJoin(session)}
        >
          <Feather name="video" size={16} color="#fff" />
          <Text style={styles.joinBtnText}>{isLive ? "انضم الآن — داخل التطبيق" : "حجز مقعد"}</Text>
        </Pressable>
      )}

      <ReportModal 
        visible={reportOpen} 
        onClose={() => setReportOpen(false)} 
        type="session" 
        targetId={session.id} 
      />
    </View>
  );
}

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);

  const { data: sessions, isLoading } = useQuery<LiveSession[]>({
    queryKey: ["live-sessions"],
    queryFn: () => apiFetch("/live-sessions"),
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const liveSessions = sessions?.filter(s => s.status === "live") || [];
  const upcomingSessions = sessions?.filter(s => s.status === "scheduled") || [];
  const pastSessions = sessions?.filter(s => s.status === "ended") || [];

  const sessionUrl = activeSession?.meetingUrl || `https://meet.jit.si/edulibya-session-${activeSession?.id}`;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={styles.headerTitle}>الجلسات المباشرة</Text>
        <Text style={styles.headerSubtitle}>تعلّم مع معلمك في الوقت الفعلي</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.tint} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={[...liveSessions, ...upcomingSessions, ...pastSessions]}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <SessionCard session={item} onJoin={setActiveSession} />}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90,
            paddingTop: 8,
            gap: 14,
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Feather name="video-off" size={48} color={C.textMuted} />
              <Text style={styles.emptyTitle}>لا توجد جلسات مباشرة</Text>
              <Text style={styles.emptySubtitle}>سيتم إضافة جلسات مباشرة قريباً</Text>
            </View>
          )}
        />
      )}

      {activeSession && (
        <InAppVideoModal
          visible
          url={sessionUrl}
          title={activeSession.titleAr || activeSession.title}
          onClose={() => setActiveSession(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text },
  headerSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLive: { borderColor: "#EF444430", backgroundColor: "#FFF5F5" },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  liveText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#EF4444" },
  cardHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 },
  cardHeaderRight: { flex: 1 },
  sessionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text, textAlign: "right", lineHeight: 22 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  statusText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  teacherRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 14 },
  teacherAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.pill, alignItems: "center", justifyContent: "center" },
  teacherName: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  metaItem: { flexDirection: "row-reverse", alignItems: "center", gap: 4, minWidth: "45%" },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textMuted },
  description: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, marginBottom: 14, textAlign: "right", lineHeight: 18 },
  joinBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.tint, borderRadius: 14, paddingVertical: 14 },
  joinBtnLive: { backgroundColor: "#EF4444" },
  joinBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: C.text },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, textAlign: "center" },
  videoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#1a1a2e" },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  videoTitle: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff", textAlign: "center" },
});
