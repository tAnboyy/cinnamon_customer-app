import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, TextInput, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { getMenuItems } from '../services/api';
// import { menuItems as dummyMenuItems } from '../data/dummyData';
import ItemCard from '../components/ItemCard';
import { MenuItem } from '../types';

const MenuScreen = () => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[MenuScreen] Fetching menu items from backend...');
      const response = await getMenuItems();
      console.log('[MenuScreen] Received menu items:', response.data?.length || 0, 'items');
      
      if (response.data && Array.isArray(response.data)) {
        setItems(response.data as MenuItem[]);
      } else {
        console.warn('[MenuScreen] Invalid response format:', response.data);
        setError('Invalid menu data received');
      }
    } catch (err) {
      console.error('[MenuScreen] Failed to load menu items:', err);
      setError('Failed to load menu items. Please try again.');
      Alert.alert(
        'Error Loading Menu',
        'Unable to fetch menu items from server. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: loadMenuItems },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      console.log('[MenuScreen] Refreshing menu items...');
      const response = await getMenuItems();
      
      if (response.data && Array.isArray(response.data)) {
        setItems(response.data as MenuItem[]);
        console.log('[MenuScreen] Menu refreshed successfully');
      } else {
        setError('Invalid menu data received');
      }
    } catch (err) {
      console.error('[MenuScreen] Failed to refresh menu:', err);
      setError('Failed to refresh menu');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredItems = items.filter(
    item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
    const { category } = item;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Convert to sections with pairs for two-column layout
  const sections = Object.keys(groupedItems).map(category => {
    const items = groupedItems[category];
    const pairs: MenuItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push([items[i], items[i + 1]].filter(Boolean));
    }
    return {
      title: category,
      data: pairs,
    };
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <Text style={styles.retryText} onPress={loadMenuItems}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Menu</Text>
        <TextInput
          style={styles.searchBar}
          placeholder="Search dishes..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <SectionList
        sections={sections}
        stickySectionHeadersEnabled={true}
        renderItem={({ item: pair }) => (
          <View style={styles.gridContainer}>
            {pair.map((item, index) => (
              <View key={item.id} style={styles.gridItem}>
                <ItemCard item={item} compact />
              </View>
            ))}
            {/* Add empty placeholder if only one item in the pair */}
            {pair.length === 1 && <View style={styles.gridItem} />}
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>{title}</Text>
          </View>
        )}
        keyExtractor={(item, index) => `pair-${index}`}
        contentContainerStyle={{ paddingBottom: 160 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000']}
            tintColor="#000"
          />
        }
        ListEmptyComponent={
          <View style={styles.centerContent}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No menu items available</Text>
            <Text style={styles.retryText} onPress={loadMenuItems}>
              Tap to reload
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#666',
    },
    errorText: {
      fontSize: 18,
      color: '#d32f2f',
      textAlign: 'center',
      marginBottom: 12,
    },
    retryText: {
      fontSize: 16,
      color: '#000',
      fontWeight: '600',
      textDecorationLine: 'underline',
      marginTop: 8,
    },
    emptyText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    header: {
      backgroundColor: '#fff',
      paddingBottom: 8,
    },
    screenTitle: {
      textAlign: 'center',
      fontSize: 22,
      fontWeight: '700',
      color: '#000',
      marginTop: 12,
    },
    searchBar: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 8,
      margin: 12,
      marginBottom: 4,
      paddingLeft: 8,
      color: '#000',
    },
    sectionHeaderContainer: {
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    sectionHeader: {
      fontSize: 20,
      fontWeight: 'bold',
      backgroundColor: '#f8f8f8',
      paddingVertical: 12,
      paddingHorizontal: 16,
      color: '#000',
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 8,
    },
    gridItem: {
      width: '50%',
      paddingHorizontal: 8,
    },
  });

export default MenuScreen;
