import React from "react";
import { View, StyleSheet } from "@react-pdf/renderer";
import type { PdfHighlightKind } from "@/features/adk-chat/adkResumeHighlightDiff";

const gutterStyles = StyleSheet.create({
  wrap: {
    position: "relative",
    width: "100%",
  },
  stripe: {
    position: "absolute",
    left: -4,
    top: 0,
    width: 2,
    bottom: 0,
    minHeight: "100%",
  },
  inner: {
    width: "100%",
  },
});

/**
 * Thin left gutter stripe for ADK-added/modified regions. Absolutely positioned in the
 * page margin so body text width and padding stay unchanged.
 */
export function PdfAdkGutterHighlight({
  kind,
  children,
}: {
  kind?: PdfHighlightKind;
  children: React.ReactNode;
}) {
  if (!kind) return <>{children}</>;
  const backgroundColor = kind === "added" ? "#22c55e" : "#ca8a04";
  return (
    <View style={gutterStyles.wrap} wrap={false}>
      <View style={[gutterStyles.stripe, { backgroundColor }]} />
      <View style={gutterStyles.inner}>{children}</View>
    </View>
  );
}
