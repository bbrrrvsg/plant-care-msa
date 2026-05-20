import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, Droplets, Sparkles, Info } from 'lucide-react-native';
import { Colors, BorderRadius, FontSize, Spacing } from '../../theme';

type NotificationType = 'warning' | 'care' | 'ai' | 'system';
type NotificationSeverity = 'critical' | 'warning' | 'info' | 'resolved';

interface Props {
  type: NotificationType;
  title: string;
  subtitle: string;
  timestamp: string;
  severity?: NotificationSeverity;
  isRead?: boolean;
}

const typeConfig: Record<NotificationType, { Icon: any; color: string; bg: string }> = {
  warning: { Icon: AlertTriangle, color: Colors.error,         bg: Colors.errorBg },
  care:    { Icon: Droplets,      color: Colors.primaryLight,  bg: Colors.primaryBgLight },
  ai:      { Icon: Sparkles,      color: Colors.blue,          bg: Colors.blueBg },
  system:  { Icon: Info,          color: Colors.textSecondary, bg: Colors.backgroundGray },
};

const severityConfig: Record<NotificationSeverity, { text: string; bg: string; textColor: string }> = {
  critical: { text: '긴급',   bg: Colors.error,         textColor: Colors.white },
  warning:  { text: '경고',   bg: Colors.orange,        textColor: Colors.white },
  info:     { text: '정보',   bg: Colors.blue,          textColor: Colors.white },
  resolved: { text: '해결됨', bg: Colors.textTertiary,  textColor: Colors.white },
};

export function NotificationCard({ type, title, subtitle, timestamp, severity, isRead = false }: Props) {
  const { Icon, color, bg } = typeConfig[type];

  return (
    <View style={[styles.card, !isRead && styles.unread]}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Icon color={color} size={20} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !isRead && styles.titleBold]} numberOfLines={1}>{title}</Text>
          {severity && (
            <View style={[styles.badge, { backgroundColor: severityConfig[severity].bg }]}>
              <Text style={[styles.badgeText, { color: severityConfig[severity].textColor }]}>
                {severityConfig[severity].text}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  unread: { backgroundColor: '#F7F7F7' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: { fontSize: FontSize.base, color: Colors.textPrimary, flex: 1 },
  titleBold: { fontWeight: '600' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    flexShrink: 0,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  timestamp: { fontSize: FontSize.xs, color: Colors.textTertiary },
});
