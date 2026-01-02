import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
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
    const phoneNumbers = ['9842429243', '9812345678', '9801122334'];

    useEffect(() => {
        // Use same menu items for Catering view (no add to cart)
        setItems(dummyMenuItems);
        setLoading(false);
      }, []);

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
  
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Catering</Text>
          <TouchableOpacity
            style={styles.callContainer}
            onPress={() => setShowCallModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.callIcon}>📞</Text>
            <Text style={styles.callText}>Call to place Catering orders</Text>
          </TouchableOpacity>
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
        <TextInput
          style={styles.searchBar}
          placeholder="Search catering..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
        <SectionList
          sections={sections}
          stickySectionHeadersEnabled={true}
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
        />
      </View>
    );
  };
  
  const styles = StyleSheet.create({
      container: {
        flex: 1,
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
      },
      modalBtnText: {
        fontWeight: '700',
      },
      numRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      },
      numText: {
        color: '#000',
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
      },
      headerTitle: {
        textAlign: 'center',
        width: '100%',
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
      },
      screenTitle: {
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
        marginTop: 12,
      },
      callContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#60df39ff',
        borderRadius: 20,
        marginHorizontal: 16,
        marginTop: 8,
        borderColor: 'gray',
        borderWidth: 0.5,
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
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        margin: 12,
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

export default CateringScreen;
