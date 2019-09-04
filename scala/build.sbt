import im.dlg.DialogHouseRules

organization := "im.dlg"

name := "dialog-clickroad-api"

version := "0.0.1"

scalaVersion := "2.11.11"

libraryDependencies ++= DialogHouseRules.scalapbGrpcDeps ++ DialogHouseRules.scalapbDeps

PB.protoSources in Compile += baseDirectory.value / ".." / "proto"

excludeFilter in PB.generate := "clickroad-private.proto"

PB.targets in Compile := Seq(
  scalapb.gen(singleLineToString = true) → (sourceManaged in Compile).value
)

licenses += ("Apache-2.0", url(
  "https://www.apache.org/licenses/LICENSE-2.0.html"))

publishTo := Some("Nexus Realm" at "https://nexus.transmit.im/repository/dialog/")

credentials += Credentials(Path.userHome / ".sbt" / ".credentials")

DialogHouseRules.defaultDialogSettings
