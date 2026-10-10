import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CallSheet } from '@/components/CallSheet';
import { Avatar, Icon, Screen, TopBar, Txt } from '@/components/ui';
import { useBooking } from '@/hooks/useBooking';
import { loc, useLang, useT, type TKey } from '@/i18n';
import { useApp } from '@/store/useApp';
import { C, F, R } from '@/theme';
import { fmtTime } from '@/utils/format';

const PASSENGER_QR: TKey[] = ['qr.p1', 'qr.p2', 'qr.p3', 'qr.p4', 'qr.p5'];
const COOLIE_QR: TKey[] = ['qr.c1', 'qr.c2', 'qr.c3', 'qr.c4', 'qr.c5'];

export default function Chat() {
  const t = useT();
  const lang = useLang();
  const { id } = useLocalSearchParams<{ id: string }>();
  const b = useBooking(id);
  const session = useApp((s) => s.session);
  const send = useApp((s) => s.sendMessage);
  const [text, setText] = useState('');
  const [call, setCall] = useState(false);
  const list = useRef<FlatList>(null);
  if (!b) return null;

  // Signed into Coolie Partner as the coolie on this booking: you speak as the coolie. Otherwise as the passenger.
  const me = session?.app === 'coolie' && b.coolie?.accountId === session.accountId ? 'coolie' : 'passenger';
  const otherName = me === 'passenger' ? (b.coolie ? loc(lang, b.coolie.name, b.coolie.nameHi) : '') : b.passengerName;
  const otherPhone = me === 'passenger' ? (b.coolie?.phone ?? '') : b.passengerPhone;
  const qr = me === 'passenger' ? PASSENGER_QR : COOLIE_QR;

  const submit = (msg: string) => {
    const m = msg.trim();
    if (!m) return;
    send(b.id, me, m);
    setText('');
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <Screen
      scroll={false}
      keyboard
      edges={['top', 'bottom']}
      header={
        <TopBar
          title={otherName}
          subtitle={me === 'passenger' ? b.coolie?.badge : `${t('job.passenger')} · ${b.id}`}
          right={
            <Pressable onPress={() => setCall(true)} style={s.callBtn} accessibilityLabel={t('common.call')}>
              <Icon name="phone" size={20} color={C.white} />
            </Pressable>
          }
        />
      }>
      <FlatList
        ref={list}
        data={b.messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={s.empty}>
            <Avatar name={otherName || '?'} color={me === 'passenger' ? b.coolie?.color : C.blue} size={64} coolie={me === 'passenger'} />
            <Txt v="small" color={C.muted} center>
              {t('chat.empty')}
            </Txt>
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.from === me;
          return (
            <View style={[s.bubble, mine ? s.mine : s.theirs]}>
              <Txt v="body" color={mine ? C.white : C.ink}>
                {item.text}
              </Txt>
              <Txt v="tiny" color={mine ? 'rgba(255,255,255,0.75)' : C.muted} style={{ alignSelf: 'flex-end' }}>
                {fmtTime(item.at, lang)}
              </Txt>
            </View>
          );
        }}
      />
      <ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={s.qr} keyboardShouldPersistTaps="handled">
        {qr.map((k) => {
          const msg = t(k, { badge: b.coolie?.badge ?? '' });
          return (
            <Pressable key={k} onPress={() => submit(msg)} style={s.qrChip}>
              <Txt v="smallMed" color={C.red}>
                {msg}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={s.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={C.muted}
          style={s.input}
          onSubmitEditing={() => submit(text)}
          returnKeyType="send"
        />
        <Pressable onPress={() => submit(text)} style={[s.send, !text.trim() && { opacity: 0.5 }]} accessibilityLabel="Send">
          <Icon name="send" size={20} color={C.white} />
        </Pressable>
      </View>
      <CallSheet visible={call} onClose={() => setCall(false)} name={otherName} phone={otherPhone} color={me === 'passenger' ? b.coolie?.color : C.blue} />
    </Screen>
  );
}

const s = StyleSheet.create({
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.lg, gap: 2 },
  mine: { alignSelf: 'flex-end', backgroundColor: C.red, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: C.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.line },
  qr: { paddingHorizontal: 12, gap: 8, paddingVertical: 8 },
  qrChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill, borderWidth: 1.5, borderColor: C.red, backgroundColor: C.white },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.white },
  input: { flex: 1, fontFamily: F.regular, fontSize: 15, color: C.ink, backgroundColor: C.bg, borderRadius: R.pill, paddingHorizontal: 16, paddingVertical: 10 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
});
