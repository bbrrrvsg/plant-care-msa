import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors, BorderRadius, FontSize, Spacing } from '../../theme';

interface PlantCardProps {
  id: number;
  name: string;
  species: string;
  image: string;
  statusText?: string;
  onPress?: () => void;
}

export function PlantCard({ name, species, image, statusText, onPress }: PlantCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.sub} numberOfLines={1}>{statusText || species}</Text>
      </View>
      <ChevronRight size={20} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
  },
  content: { flex: 1 },
  name: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textGreen,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
