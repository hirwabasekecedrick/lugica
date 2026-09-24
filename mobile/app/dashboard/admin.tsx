import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';

type AdminTab = 'overview' | 'catalog' | 'procurement';

const products = [
  { name: 'Lugica GPS OBD-II Vehicle Tracker', sku: 'LGC-GPS-001', category: 'Hardware', stock: 45, status: 'In stock' },
  { name: 'Rugged Handheld Barcode Scanner', sku: 'LGC-SCN-002', category: 'Hardware', stock: 8, status: 'Low stock' },
  { name: 'Thermal Shipping Label Rolls', sku: 'LGC-LBL-003', category: 'Supplies', stock: 120, status: 'In stock' },
  { name: 'Insulated Courier Delivery Backpack', sku: 'LGC-BAG-004', category: 'Gear', stock: 0, status: 'Out of stock' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="flex-1 bg-[#0b1324]">
      <ScrollView contentContainerClassName="px-5 pb-10 pt-6">
        <Text className="text-sm text-[#6984A9]">Lugica Express Central Hub</Text>
        <Text className="mt-1 text-2xl font-bold text-[#EEFABD]">Good morning, Admin</Text>
        <Text className="mt-1 text-xs text-[#6984A9]">Inventory and dispatch operations</Text>

        <View className="mt-6 flex-row rounded-xl border border-[#263B6A] bg-[#0d1525] p-1">
          {[
            ['overview', 'Dashboard'],
            ['catalog', 'Catalog'],
            ['procurement', 'Procurement'],
          ].map(([tab, label]) => (
            <Pressable
              key={tab}
              className={`flex-1 items-center rounded-lg px-2 py-3 ${activeTab === tab ? 'bg-[#263B6A]' : ''}`}
              onPress={() => setActiveTab(tab as AdminTab)}
            >
              <Text className={`text-xs font-semibold ${activeTab === tab ? 'text-[#EEFABD]' : 'text-[#6984A9]'}`}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'overview' && (
          <View className="mt-5 gap-4 bg-transparent">
            <View className="flex-row gap-3 bg-transparent">
              <Metric label="Inventory value" value="$18,420" accent="lime" />
              <Metric label="Warehouse units" value="189" accent="white" />
            </View>
            <View className="flex-row gap-3 bg-transparent">
              <Metric label="Fulfillment rate" value="99.4%" accent="lime" />
              <Metric label="Restock alerts" value="3 items" accent="amber" />
            </View>

            <View className="rounded-2xl border border-[#263B6A] bg-[#0d1525] p-5">
              <Text className="font-bold text-white">Inventory logistics flow</Text>
              <Text className="mt-1 text-xs text-[#6984A9]">Inbound procurement vs outbound dispatches</Text>
              <View className="mt-6 h-36 flex-row items-end justify-between gap-2">
                {[58, 72, 64, 84, 76, 92].map((height, index) => (
                  <View key={index} className="flex-1 items-center gap-2 bg-transparent">
                    <View className="w-full rounded-t-md bg-[#A0D585]" style={{ height: `${height}%` }} />
                    <Text className="text-[10px] text-[#6984A9]">{['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][index]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="rounded-2xl border border-[#263B6A] bg-[#0d1525] p-5">
              <Text className="font-bold text-white">Warehouse status</Text>
              <View className="mt-4 flex-row items-center">
                <View className="h-3 w-3 rounded-full bg-[#A0D585]" />
                <Text className="ml-3 text-sm text-[#A0D585]">Operational</Text>
                <Text className="ml-auto text-xs text-[#6984A9]">3 restock alerts</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'catalog' && (
          <View className="mt-5 gap-4 bg-transparent">
            <View className="flex-row items-center rounded-xl border border-[#263B6A] bg-[#0d1525] px-4">
              <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor="#6984A9" size={18} />
              <TextInput
                className="ml-3 flex-1 py-4 text-sm text-white"
                placeholder="Search product or SKU..."
                placeholderTextColor="#6984A9"
                value={search}
                onChangeText={setSearch}
              />
            </View>
            {filteredProducts.map((product) => (
              <View key={product.sku} className="rounded-2xl border border-[#263B6A] bg-[#0d1525] p-4">
                <View className="flex-row items-start">
                  <View className="rounded-xl bg-[#182645] p-3">
                    <SymbolView name={{ ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' }} tintColor="#A0D585" size={22} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-white">{product.name}</Text>
                    <Text className="mt-1 text-xs text-[#6984A9]">{product.sku} · {product.category}</Text>
                  </View>
                  <Text className={`text-xs font-bold ${product.status === 'In stock' ? 'text-[#A0D585]' : product.status === 'Low stock' ? 'text-amber-400' : 'text-rose-400'}`}>
                    {product.status}
                  </Text>
                </View>
                <View className="mt-4 flex-row items-center border-t border-[#263B6A] pt-3">
                  <Text className="text-xs text-[#6984A9]">Stock level</Text>
                  <Text className="ml-auto font-bold text-[#EEFABD]">{product.stock} units</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'procurement' && (
          <View className="mt-5 gap-4 bg-transparent">
            <View className="rounded-2xl border border-[#263B6A] bg-[#0d1525] p-5">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#A0D585]">Shop manager action</Text>
              <Text className="mt-2 text-lg font-bold text-white">Procurement and inbound stock</Text>
              <Text className="mt-2 text-sm leading-5 text-[#6984A9]">Log supplier delivery batches and immediately replenish warehouse stock.</Text>
              <Pressable className="mt-5 items-center rounded-xl bg-[#A0D585] py-4">
                <Text className="font-bold text-[#0d1525]">Record inbound batch</Text>
              </Pressable>
            </View>
            <View className="rounded-2xl border border-[#263B6A] bg-[#0d1525] p-5">
              <Text className="font-bold text-white">Procurement audit history</Text>
              <Text className="mt-1 text-xs text-[#6984A9]">2 batches logged</Text>
              <AuditRow batch="BN-2026-0881" product="GPS Vehicle Tracker" quantity="+50 units" />
              <AuditRow batch="BN-2026-0943" product="Thermal Label Rolls" quantity="+100 units" />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: 'lime' | 'white' | 'amber' }) {
  const color = accent === 'lime' ? 'text-[#EEFABD]' : accent === 'amber' ? 'text-amber-400' : 'text-white';
  return (
    <View className="flex-1 rounded-2xl border border-[#263B6A] bg-[#0d1525] p-4">
      <Text className="text-[10px] font-semibold uppercase text-[#6984A9]">{label}</Text>
      <Text className={`mt-2 text-xl font-black ${color}`}>{value}</Text>
    </View>
  );
}

function AuditRow({ batch, product, quantity }: { batch: string; product: string; quantity: string }) {
  return (
    <View className="mt-4 flex-row items-center border-t border-[#263B6A] pt-4">
      <View className="flex-1">
        <Text className="font-mono text-sm font-bold text-[#EEFABD]">{batch}</Text>
        <Text className="mt-1 text-xs text-[#6984A9]">{product}</Text>
      </View>
      <Text className="text-sm font-bold text-[#A0D585]">{quantity}</Text>
    </View>
  );
}
