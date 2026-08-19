import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAppNavigation } from '../navigation/NavigationContext';
import { mockSchemes } from '../data/mockData';
import { CategoryCard } from '../components/CategoryCard';
import { SchemeCard } from '../components/SchemeCard';
import { SchemeCategory } from '../types';

export const DiscoverSchemesScreen = () => {
  const {
    t,
    setVoiceAssistantVisible,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
  } = useAppNavigation();

  const [showSearchInput, setShowSearchInput] = useState(false);

  const categories: SchemeCategory[] = [
    'Agriculture',
    'Education',
    'Health',
    'Housing',
    'Employment',
    'Women & Child',
    'Pension',
    'Disability',
  ];

  const handleCategoryPress = (category: SchemeCategory) => {
    if (selectedCategory === category) {
      setSelectedCategory(null); // Deselect if tapped again
    } else {
      setSelectedCategory(category);
    }
  };

  const filteredSchemes = mockSchemes.filter((scheme) => {
    const matchesCategory = selectedCategory ? scheme.category === selectedCategory : true;
    const matchesSearch = searchQuery
      ? scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Search Header Action bar */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>{t('discoverSchemes')}</Text>
        <TouchableOpacity
          onPress={() => setShowSearchInput(!showSearchInput)}
          style={styles.searchIconButton}
        >
          <Ionicons name={showSearchInput ? 'close' : 'search'} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Dynamic Search Bar */}
      {showSearchInput && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder={t('typePlaceholder')}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      )}

      {/* AI input card */}
      <TouchableOpacity
        onPress={() => setVoiceAssistantVisible(true)}
        style={styles.aiInputCard}
        activeOpacity={0.8}
      >
        <View style={styles.aiMicCircle}>
          <Ionicons name="mic" size={20} color={COLORS.white} />
        </View>
        <View style={styles.aiTextContainer}>
          <Text style={styles.aiTitle}>{t('tellUs')}</Text>
          <Text style={styles.aiSub}>{t('speakOrType')}</Text>
        </View>
      </TouchableOpacity>

      {/* Browse Category Section */}
      <Text style={styles.sectionTitle}>{t('browseCategory')}</Text>
      <View style={styles.categoriesGrid}>
        {categories.map((cat) => (
          <CategoryCard
            key={cat}
            category={cat}
            isActive={selectedCategory === cat}
            onPress={() => handleCategoryPress(cat)}
          />
        ))}
      </View>

      {/* Results / List Section */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {selectedCategory ? `${tCategoryName(selectedCategory)}` : 'All Schemes'} ({filteredSchemes.length})
        </Text>
        {selectedCategory && (
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredSchemes.length > 0 ? (
        filteredSchemes.map((scheme) => <SchemeCard key={scheme.id} scheme={scheme} />)
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No schemes match your query.</Text>
        </View>
      )}

      {/* Help Recommendation Widget */}
      <View style={styles.helpWidgetCard}>
        <View style={styles.helpWidgetTextCol}>
          <Text style={styles.helpWidgetTitle}>{t('notSureTitle')}</Text>
          <Text style={styles.helpWidgetDesc}>{t('notSureDesc')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setVoiceAssistantVisible(true)}
          style={styles.arrowButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  function tCategoryName(cat: string) {
    return cat;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  searchIconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
  },
  aiInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  aiMicCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  aiSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  helpWidgetCard: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.lightBorder,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  helpWidgetTextCol: {
    flex: 1,
    marginRight: 16,
  },
  helpWidgetTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  helpWidgetDesc: {
    fontSize: 12,
    color: COLORS.textDark,
    marginTop: 4,
    lineHeight: 16,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default DiscoverSchemesScreen;
