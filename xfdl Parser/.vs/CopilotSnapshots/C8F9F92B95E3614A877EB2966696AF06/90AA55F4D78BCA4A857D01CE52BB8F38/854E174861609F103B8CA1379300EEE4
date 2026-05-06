using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;

namespace XfdlParser
{
    public class XfdlDocument
    {
        public System.Xml.Linq.XDocument Xml { get; private set; }
        public IDictionary<string, string> Fields { get; private set; }

        public XfdlDocument(System.Xml.Linq.XDocument xml)
        {
            Xml = xml;
            Fields = ExtractFields(xml);
        }

        private IDictionary<string, string> ExtractFields(System.Xml.Linq.XDocument xml)
        {
            var dict = new Dictionary<string, string>();

            // XFDL forms often use namespaces like xfdl:, globalpage:, etc.
            var allElements = xml.Descendants();

            foreach (var el in allElements.OfType<System.Xml.Linq.XElement>())
            {
                // Common XFDL field patterns:
                // <field sid="FieldName">Value</field>
                // <value>SomeValue</value>
                // <item name="FieldName">Value</item>

                var sid = el.Attribute("sid")?.Value;
                var name = el.Attribute("name")?.Value;

                if (!string.IsNullOrWhiteSpace(sid))
                {
                    dict[sid] = el.Value?.Trim();
                }
                else if (!string.IsNullOrWhiteSpace(name))
                {
                    dict[name] = el.Value?.Trim();
                }
            }

            return dict;
        }
    }

    public static class XfdlLoader
    {
        public static XfdlDocument Load(string path)
        {
            if (!File.Exists(path))
                throw new FileNotFoundException("XFDL file not found.", path);

            var raw = File.ReadAllText(path);

            // Some XFDL files prepend non-XML headers.
            var xmlStart = raw.IndexOf("<?xml", StringComparison.OrdinalIgnoreCase);
            if (xmlStart < 0)
                throw new InvalidDataException("No XML header found in XFDL file.");

            var xmlContent = raw.Substring(xmlStart);

            // Use the correct enum value for LoadOptions and avoid naming collision.
            var loadOptions = System.Xml.Linq.LoadOptions.PreserveWhitespace;

            // Fully qualify XDocument.Parse to ensure we call the System.Xml.Linq implementation.
            var xml = System.Xml.Linq.XDocument.Parse(xmlContent, loadOptions);

            return new XfdlDocument(xml);
        }
    }

    [Serializable]
    internal class InvalidDataException : Exception
    {
        public InvalidDataException()
        {
        }

        public InvalidDataException(string message) : base(message)
        {
        }

        public InvalidDataException(string message, Exception innerException) : base(message, innerException)
        {
        }

        protected InvalidDataException(SerializationInfo info, StreamingContext context) : base(info, context)
        {
        }
    }
}
