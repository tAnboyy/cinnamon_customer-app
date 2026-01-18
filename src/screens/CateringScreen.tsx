import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SectionList, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Platform, Animated, ScrollView } from 'react-native';
import { Linking } from 'react-native';
// import { getMenuItems } from '../services/api';
import { menuItems as dummyMenuItems } from '../data/dummyData';
import ItemCard from '../components/ItemCard';
import { MenuItem } from '../types';

const CateringScreen = () => {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCallModal, setShowCallModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const phoneNumbers = ['9842429243', '9812345678', '9801122334'];
    const scrollY = useRef(0);
    const headerHeight = useRef(new Animated.Value(1)).current;
    const sectionListRef = useRef<SectionList<any>>(null);

    useEffect(() => {
        // Use same menu items for Catering view (no add to cart)
        setItems(dummyMenuItems);
        setLoading(false);
      }, []);

    const searchFilteredItems = items.filter(
      item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    );

    const categories = ['All', ...Array.from(new Set(searchFilteredItems.map(i => i.category)))];

    useEffect(() => {
      if (selectedCategory !== 'All' && !categories.includes(selectedCategory)) {
        setSelectedCategory('All');
      }
    }, [categories, selectedCategory]);

    const filteredItems = selectedCategory === 'All'
      ? searchFilteredItems
      : searchFilteredItems.filter(item => item.category === selectedCategory);

  const groupedItems = filteredItems.reduce((acc, item) => {
      const { category } = item;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  
    // Convert to sections with pairs for two-column layout
    const sections = Object.keys(groupedItems).sort().map(category => {
      const items = groupedItems[category];
      const pairs: MenuItem[][] = [];
      for (let i = 0; i < items.length; i += 2) {
        pairs.push([items[i], items[i + 1]].filter(Boolean));
      }
      return {
        title: category,
        data: pairs,
      };
    });    if (loading) {
      return <ActivityIndicator size={48} style={styles.container} />;
    }
  
    const scrollToTop = () => {
      const responder = (sectionListRef.current as any)?.getScrollResponder?.();
      if (responder?.scrollTo) {
        responder.scrollTo({ y: 0, animated: true });
      }
    };

    return (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Animated.View style={{
              opacity: Platform.OS === 'web' ? headerHeight : 1,
              maxHeight: Platform.OS === 'web' ? headerHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200]
              }) : undefined,
              overflow: 'hidden'
            }}>
              <Text style={styles.screenTitle}>Catering</Text>
              <TouchableOpacity
                style={styles.callContainer}
                onPress={() => setShowCallModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.callIcon}>📞</Text>
                <Text style={styles.callText}>Call to place Catering orders</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        <Modal
          visible={showCallModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCallModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select a number to call</Text>
              <View style={{ marginTop: 8 }}>
                {phoneNumbers.map(num => (
                  <TouchableOpacity
                    key={num}
                    style={styles.numRow}
                    activeOpacity={0.8}
                    onPress={async () => {
                      const url = `tel://${num}`;
                      try {
                        const supported = await Linking.canOpenURL(url);
                        if (supported) {
                          setShowCallModal(false);
                          await Linking.openURL(url);
                        } else {
                          console.warn('Phone calls not supported on this device/emulator');
                        }
                      } catch (e) {
                        console.error('Failed to initiate call', e);
                      }
                    }}
                  >
                    <Text style={styles.numText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#f2f2f2' }]}
                  onPress={() => setShowCallModal(false)}
                >
                  <Text style={[styles.modalBtnText, { color: '#000' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Animated.View style={{
          opacity: Platform.OS === 'web' ? headerHeight : 1,
          maxHeight: Platform.OS === 'web' ? headerHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 100]
          }) : undefined,
          overflow: 'hidden'
        }}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search catering..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChips}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  scrollToTop();
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          stickySectionHeadersEnabled={true}
          onScroll={Platform.OS === 'web' ? (event) => {
            const currentScrollY = event.nativeEvent.contentOffset.y;
            const diff = currentScrollY - scrollY.current;
            
            if (diff > 5 && currentScrollY > 50) {
              // Scrolling down
              Animated.timing(headerHeight, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false
              }).start();
            } else if (diff < -5) {
              // Scrolling up
              Animated.timing(headerHeight, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false
              }).start();
            }
            
            scrollY.current = currentScrollY;
          } : undefined}
          scrollEventThrottle={16}
          renderItem={({ item: pair }) => (
            <View style={styles.gridContainer}>
              {pair.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  <ItemCard item={item} hideAdd hideQuantityBadge hidePrice compact />
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
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        />
      </View>
    </View>
    );
  };
  
  const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        ...(Platform.OS === 'web' && {
          minHeight: '100vh',
        }),
      },
      contentWrapper: {
        flex: 1,
        maxWidth: Platform.OS === 'web' ? 1200 : undefined,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: '#fff',
      },
      modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      },
      modalCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
      },
      modalTitle: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
      },
      modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 12,
      },
      modalBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
        }),
      },
      modalBtnText: {
        fontWeight: '700',
      },
      numRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
        }),
      },
      numText: {
        color: '#1a1a1a',
        fontSize: 16,
        fontWeight: '600',
      },
      headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
      },
      header: {
        backgroundColor: '#fff',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
      },
      headerTitle: {
        textAlign: 'center',
        width: '100%',
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
      },
      screenTitle: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginTop: 14,
        marginBottom: 6,
      },
      callContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: '#60df39ff',
        borderRadius: 20,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 6,
        borderColor: 'gray',
        borderWidth: 0.5,
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
        }),
      },
      callText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '600',
      },
      callIcon: {
        fontSize: 16,
      },
      searchBar: {
        height: 48,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 12,
        marginHorizontal: Platform.OS === 'web' ? 24 : 12,
        marginVertical: 8,
        paddingHorizontal: 16,
        color: '#1a1a1a',
        fontSize: 16,
        backgroundColor: '#fafafa',
        ...(Platform.OS === 'web' && {
          outlineStyle: 'none',
        }),
      },
      sectionHeaderContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
      },
      sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        backgroundColor: '#f8f8f8',
        paddingVertical: 10,
        paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
        color: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        textAlign: Platform.OS === 'web' ? 'center' : 'left',
      },
      gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Platform.OS === 'web' ? 16 : 8,
        paddingVertical: 6,
        maxWidth: Platform.OS === 'web' ? 800 : undefined,
        alignSelf: Platform.OS === 'web' ? 'center' : undefined,
        width: '100%',
      },
      gridItem: {
        width: '50%',
        paddingHorizontal: 8,
        marginBottom: 10,
      },
      categoryChips: {
      // align first chip left edge with searchBar left edge (match searchBar marginHorizontal)
      paddingHorizontal: Platform.OS === 'web' ? 24 : 12,
        paddingBottom: Platform.OS === 'web' ? 12 : 10,
      paddingTop: 4,
      gap: 6,
    },
    categoryChip: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: '#f2f2f2',
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    categoryChipActive: {
      backgroundColor: '#1a1a1a',
      borderColor: '#1a1a1a',
    },
    categoryChipText: {
      color: '#1a1a1a',
      fontSize: 13,
      fontWeight: '600',
    },
    categoryChipTextActive: {
      color: '#fff',
    },
    });

export default CateringScreen;
