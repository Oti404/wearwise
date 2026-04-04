import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Star, X, Sparkles, MessageSquare } from 'lucide-react-native';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  itemName?: string;
}

export function RatingModal({ visible, onClose, onSubmit, itemName }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLevelSelect = (level: number) => {
    setRating(level);
  };

  const handlePressSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await onSubmit(rating, comment);
      setRating(0);
      setComment('');
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Sparkles size={20} color="#F4C542" />
                <Text style={styles.title}>Product Rating</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#2B2B2B" strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              <Text style={styles.subtitle}>
                How was the purchase for{'\n'}
                <Text style={styles.itemName}>{itemName || 'this product'}?</Text>
              </Text>

              {/* Stars */}
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleLevelSelect(star)}
                    activeOpacity={0.7}
                  >
                    <Star
                      size={42}
                      color={star <= rating ? "#F4C542" : "rgba(90, 45, 130, 0.1)"}
                      fill={star <= rating ? "#F4C542" : "transparent"}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating Label */}
              <Text style={styles.ratingLabel}>
                {rating === 0 ? 'Choose a rating' : 
                 rating === 1 ? 'Very poor' :
                 rating === 2 ? 'Poor' :
                 rating === 3 ? 'Ok' :
                 rating === 4 ? 'Very good' : 'Excellent! ✨'}
              </Text>

              {/* Comment Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <MessageSquare size={12} color="#5A2D82" />
                  <Text style={styles.label}>Comment (optional)</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Tell us more about your experience..."
                    multiline
                    numberOfLines={3}
                    value={comment}
                    onChangeText={setComment}
                  />
                </View>
              </View>
            </View>

            {/* Footer */}
            <TouchableOpacity
              style={[styles.submitBtn, (rating === 0 || loading) && styles.submitBtnDisabled]}
              onPress={handlePressSubmit}
              disabled={rating === 0 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#5A2D82" />
              ) : (
                <>
                  <Text style={styles.submitText}>Submit Rating</Text>
                  <Sparkles size={18} color="#5A2D82" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 43, 43, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  content: {
    backgroundColor: '#FAF7F2',
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2B2B2B',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(90, 45, 130, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 24,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(43, 43, 43, 0.7)',
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 24,
  },
  itemName: {
    color: '#5A2D82',
    fontWeight: '900',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
    color: '#F4C542',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(90, 45, 130, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(90, 45, 130, 0.05)',
  },
  input: {
    padding: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#2B2B2B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#F4C542',
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(244, 197, 66, 0.3)',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#5A2D82',
    letterSpacing: 0.5,
  },
});
